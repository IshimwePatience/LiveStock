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
      const isNationalPolice = user.role === 'POLICE' && (!user.district_id || user.district_id === 'NATIONAL' || user.district_id === '');
      const isNationalUser = user.role === 'RAB' || user.role === 'ADMIN' || isNationalPolice;

      // 1. Get all active trips & movement requests
      const [activeTrips, activeRequests] = await Promise.all([
        Trip.findAll({
          where: { status: ['ACTIVE', 'SCHEDULED', 'ARRIVED'] },
          include: [{
            model: MovementRequest,
            include: [{ model: User, as: 'Initiator' }]
          }]
        }),
        MovementRequest.findAll({
          where: { status: ['APPROVED', 'ACTIVE', 'COMPLETED'] },
          include: [{ model: User, as: 'Initiator' }]
        })
      ]);

      // 2. Filter trips based on RBAC (RAB, Admin & National Police see all; DARO/SARO see origin/dest; Drivers see assigned car)
      const allowedPlateNumbers = new Set();

      const addPlateIfAllowed = (plate, req, trip = null) => {
        if (!plate) return;

        const isInitiator = req && req.initiator_id === user.id;
        const isApprover = req && req.approver_id === user.id;

        const isDriver = (req?.driver_phone && user.phone && req.driver_phone === user.phone) ||
          (trip?.driver_phone && user.phone && trip.driver_phone === user.phone) ||
          (req?.driver_name && user.name && req.driver_name.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
          (trip?.driver_name && user.name && trip.driver_name.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
          (user.role === 'DRIVER');

        const isOriginOfficer = (user.role === 'DARO' && user.district_id && req?.origin_district === user.district_id) ||
          (user.role === 'SARO' && user.sector_id && req?.origin_sector === user.sector_id);

        let isReceiver = false;
        if (req) {
          if (req.type === 'DISTRICT_TO_DISTRICT') {
            isReceiver = user.role === 'DARO' && user.district_id && req.dest_district === user.district_id;
          } else if (req.type === 'SECTOR_TO_SECTOR') {
            isReceiver = user.role === 'SARO' && user.sector_id && req.dest_sector === user.sector_id;
          }
        }

        const isDistrictPolice = user.role === 'POLICE' && user.district_id && user.district_id !== 'NATIONAL' &&
          req && (req.origin_district === user.district_id || req.dest_district === user.district_id);

        if (isNationalUser || isInitiator || isApprover || isReceiver || isOriginOfficer || isDriver || isDistrictPolice) {
          allowedPlateNumbers.add(plate.toUpperCase().trim());
        }
      };

      activeTrips.forEach(trip => {
        const req = trip.MovementRequest;
        addPlateIfAllowed(trip.plate_number || req?.plate_number, req, trip);
      });

      activeRequests.forEach(req => {
        addPlateIfAllowed(req.plate_number, req, null);
      });

      const [devicesRes, positionsRes] = await Promise.all([
        this.client.get('/api/devices'),
        this.client.get('/api/positions')
      ]);

      const devices = devicesRes.data;
      const positions = positionsRes.data;

      // Map device IDs to positions, filtering by allowed plate numbers
      const deviceMap = {};
      devices.forEach(device => {
        if (isNationalUser || allowedPlateNumbers.has(device.name.toUpperCase())) {
          const devicePlate = device.name.toUpperCase().trim();

          // Find matching trip or movement request from DB for this vehicle device
          const trip = activeTrips.find(t => t.plate_number?.toUpperCase().trim() === devicePlate);
          const req = trip?.MovementRequest || activeRequests.find(r => r.plate_number?.toUpperCase().trim() === devicePlate);

          const dName = req?.driver_name || req?.owner_name || (req?.Initiator ? req.Initiator.name : 'Unassigned');
          const dPhone = req?.driver_phone || req?.owner_phone || (req?.Initiator ? req.Initiator.phone : (device.phone || 'N/A'));

          deviceMap[device.id] = {
            id: device.id,
            name: device.name,
            phone: device.phone,
            status: device.status,
            lastUpdate: device.lastUpdate,
            driverName: dName,
            driverPhone: dPhone,
            route: req ? {
              originDistrict: req.origin_district,
              originSector: req.origin_sector,
              destDistrict: req.dest_district,
              destSector: req.dest_sector,
              origin: req.origin_district ? `${req.origin_sector || ''}, ${req.origin_district}` : 'Origin',
              destination: req.dest_district ? `${req.dest_sector || ''}, ${req.dest_district}` : 'Destination',
              initiator: req.Initiator ? req.Initiator.name : 'Unknown',
              driverName: dName,
              driverPhone: dPhone,
              permitNumber: req.permit_number,
              tripStatus: trip?.status || req?.status || 'SCHEDULED',
              otp: trip?.otp || 'N/A'
            } : null
          };
        }
      });

      const locations = await Promise.all(
        positions
          .filter(pos => deviceMap[pos.deviceId])
          .map(async pos => {
            const device = deviceMap[pos.deviceId];
            const geofenceService = require('./geofenceService');
            const violation = await geofenceService.checkVehicleViolation(device.name, pos.latitude, pos.longitude);

            const todayDist = pos.attributes?.distance
              ? (pos.attributes.distance / 1000).toFixed(1)
              : (pos.attributes?.totalDistance ? ((pos.attributes.totalDistance % 300000) / 1000).toFixed(1) : (pos.speed > 0 ? (pos.speed * 1.852 * 0.4).toFixed(1) : '0.0'));

            const topSpd = pos.attributes?.maxSpeed
              ? (pos.attributes.maxSpeed * 1.852).toFixed(1)
              : (pos.speed ? (pos.speed * 1.852 * 1.25).toFixed(1) : '0.0');

            return {
              deviceId: pos.deviceId,
              deviceName: device.name || 'Unknown',
              devicePhone: device.phone || '',
              driverName: device.driverName || 'Unassigned',
              driverPhone: device.driverPhone || 'N/A',
              status: device.status || 'offline',
              lastUpdate: device.lastUpdate || pos.serverTime,
              latitude: pos.latitude,
              longitude: pos.longitude,
              speed: pos.speed,
              course: pos.course,
              todayDistance: todayDist,
              topSpeed: topSpd,
              attributes: pos.attributes,
              route: device.route,
              geofenceViolation: violation
            };
          })
      );

      return locations;
    } catch (error) {
      console.warn('GPS Traccar server connection offline/unreachable:', error.message);
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
        timeout: 30000 // 30 seconds for historical route queries
      });
      return res.data;
    } catch (error) {
      console.warn(`Traccar route report warning for device ${deviceId}: ${error.message}`);
      return [];
    }
  }
}

module.exports = new TraccarService();
