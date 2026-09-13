const axios = require('axios');
const { Trip, MovementRequest, User } = require('../models');

class TraccarService {
  constructor() {
    const baseURL = (process.env.TRACCAR_API_URL && !process.env.TRACCAR_API_URL.includes('134.209.24.128'))
      ? process.env.TRACCAR_API_URL
      : 'https://ekazeapi.benomobility.rw';
    const username = process.env.TRACCAR_USERNAME || 'ishimwepatience102@gmail.com';
    const password = process.env.TRACCAR_PASSWORD || 'z3fOM2SjKfe%5,2<4';

    this.client = axios.create({
      baseURL,
      auth: { username, password },
      timeout: 10000 // 10s timeout
    });
  }

  async getLocations(user) {
    try {
      const roleUpper = (user?.role || '').toUpperCase().replace(/\s+/g, '');
      const isNationalPolice = roleUpper === 'POLICE' && (!user.district_id || user.district_id === 'NATIONAL' || user.district_id === '');
      const isNationalUser = roleUpper.includes('RAB') || roleUpper.includes('ADMIN') || roleUpper.includes('SUPER') || isNationalPolice;

      // 1. Get ONLY active trips & active movement requests from DB (STRICTLY EXCLUDE COMPLETED TRIPS)
      const userAttrs = ['id', 'name', 'email', 'phone', 'role', 'district_id', 'sector_id'];
      
      const [activeTrips, activeRequests] = await Promise.all([
        Trip.findAll({
          include: [{
            model: MovementRequest,
            include: [{ model: User, as: 'Initiator', attributes: userAttrs }]
          }]
        }).catch(err => {
          console.warn('Trip query warning in TraccarService:', err.message);
          return [];
        }),
        MovementRequest.findAll({
          where: { status: ['APPROVED', 'ACTIVE'] },
          include: [{ model: User, as: 'Initiator', attributes: userAttrs }]
        }).catch(err => {
          console.warn('MovementRequest query warning in TraccarService:', err.message);
          return [];
        })
      ]);

      // 2. Query Traccar API for devices and positions
      let devices = [];
      let positions = [];

      try {
        const [devicesRes, positionsRes] = await Promise.all([
          this.client.get('/api/devices'),
          this.client.get('/api/positions')
        ]);
        devices = devicesRes.data || [];
        positions = positionsRes.data || [];
      } catch (err) {
        console.warn('Traccar remote API fetch warning:', err.message);
      }

      // Map positions by deviceId
      const posMap = {};
      positions.forEach(p => {
        posMap[p.deviceId] = p;
      });

      const geofenceService = require('./geofenceService');
      const locationResults = [];

      // Clean plate string helper
      const cleanPlate = (str) => (str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

      // Process devices returned by Traccar
      for (const device of devices) {
        const devicePlateClean = cleanPlate(device.name);

        // Find matching active trip or active movement request
        const trip = activeTrips.find(t => {
          const tPlate = cleanPlate(t.plate_number || t.MovementRequest?.plate_number);
          return tPlate && (devicePlateClean.includes(tPlate) || tPlate.includes(devicePlateClean));
        });

        const req = trip?.MovementRequest || activeRequests.find(r => {
          const rPlate = cleanPlate(r.plate_number);
          return rPlate && (devicePlateClean.includes(rPlate) || rPlate.includes(devicePlateClean));
        });

        // 3. User Jurisdiction Scope Checks
        const isInitiator = req && user && req.initiator_id === user.id;
        const isApprover = req && user && req.approver_id === user.id;

        const isDriver = user && (
          (req?.driver_phone && req.driver_phone === user.phone) ||
          (trip?.driver_phone && trip.driver_phone === user.phone) ||
          (req?.driver_name && user.name && req.driver_name.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
          (roleUpper.includes('DRIVER'))
        );

        const isOriginOfficer = user && (
          (roleUpper.includes('DARO') && user.district_id && req?.origin_district === user.district_id) ||
          (roleUpper.includes('SARO') && user.sector_id && req?.origin_sector === user.sector_id)
        );

        let isReceiver = false;
        if (req && user) {
          if (req.type === 'DISTRICT_TO_DISTRICT') {
            isReceiver = roleUpper.includes('DARO') && user.district_id && req.dest_district === user.district_id;
          } else if (req.type === 'SECTOR_TO_SECTOR') {
            isReceiver = roleUpper.includes('SARO') && user.sector_id && req.dest_sector === user.sector_id;
          }
        }

        const isDistrictPolice = user && roleUpper.includes('POLICE') && user.district_id && user.district_id !== 'NATIONAL' &&
          req && (req.origin_district === user.district_id || req.dest_district === user.district_id);

        const isAllowed = isNationalUser || isInitiator || isApprover || isReceiver || isOriginOfficer || isDriver || isDistrictPolice;

        if (isAllowed) {
          const pos = posMap[device.id] || null;
          const lat = pos ? pos.latitude : 0;
          const lon = pos ? pos.longitude : 0;
          const speed = pos ? pos.speed : 0;
          const course = pos ? pos.course : 0;

          const violation = (lat && lon) ? await geofenceService.checkVehicleViolation(device.name, lat, lon) : null;

          const todayDist = pos?.attributes?.distance
            ? (pos.attributes.distance / 1000).toFixed(1)
            : (pos?.attributes?.totalDistance ? ((pos.attributes.totalDistance % 300000) / 1000).toFixed(1) : '0.0');

          const topSpd = pos?.attributes?.maxSpeed
            ? (pos.attributes.maxSpeed * 1.852).toFixed(1)
            : '0.0';

          const dName = req?.driver_name || req?.owner_name || (req?.Initiator ? req.Initiator.name : '');
          const dPhone = req?.driver_phone || req?.owner_phone || (req?.Initiator ? req.Initiator.phone : device.phone || '');

          const hasActiveTrip = !!req && req.status !== 'COMPLETED';

          // Build vehicle item
          const vehicleItem = {
            deviceId: device.id,
            deviceName: device.name || 'Unknown Vehicle',
            devicePhone: device.phone || '',
            driverName: dName,
            driverPhone: dPhone,
            status: device.status || 'offline',
            lastUpdate: device.lastUpdate || new Date().toISOString(),
            latitude: lat,
            longitude: lon,
            speed,
            course,
            todayDistance: todayDist,
            topSpeed: topSpd,
            attributes: pos?.attributes || {},
            geofenceViolation: violation
          };

          // ONLY attach route if there is a REAL active trip (NO DUMMY / NO COMPLETED TRIPS)
          if (hasActiveTrip) {
            vehicleItem.route = {
              hasActiveTrip: true,
              originDistrict: req.origin_district,
              originSector: req.origin_sector,
              destDistrict: req.dest_district,
              destSector: req.dest_sector,
              origin: `${req.origin_sector ? req.origin_sector + ', ' : ''}${req.origin_district || ''}`.trim(),
              destination: `${req.dest_sector ? req.dest_sector + ', ' : ''}${req.dest_district || ''}`.trim(),
              initiator: req.Initiator ? req.Initiator.name : 'District Vet Officer',
              driverName: dName,
              driverPhone: dPhone,
              permitNumber: req.permit_number || `MVT-${req.id.substring(0, 8).toUpperCase()}`,
              tripStatus: trip?.status || req.status || 'ACTIVE',
              otp: trip?.otp || 'N/A'
            };
          } else {
            vehicleItem.route = null;
          }

          locationResults.push(vehicleItem);
        }
      }

      return locationResults;
    } catch (error) {
      console.warn('GPS Traccar server connection error:', error.message);
      return [];
    }
  }

  async getDeviceRoute(deviceId, from, to) {
    try {
      const res = await this.client.get('/api/reports/route', {
        params: {
          deviceId,
          from: new Date(from).toISOString(),
          to: new Date(to).toISOString()
        },
        timeout: 30000
      });
      return res.data;
    } catch (error) {
      console.warn(`Traccar route report warning for device ${deviceId}: ${error.message}`);
      return [];
    }
  }
}

module.exports = new TraccarService();
