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
      const isNationalUser = user.role === 'RAB' || isNationalPolice;

      // 1. Get all active trips & movement requests
      const [activeTrips, activeMovements] = await Promise.all([
        Trip.findAll({
          where: { status: 'ACTIVE' },
          include: [{ 
            model: MovementRequest,
            include: [{ model: User, as: 'Initiator' }]
          }]
        }),
        MovementRequest.findAll({
          include: [{ model: User, as: 'Initiator' }]
        })
      ]);

      // 2. Filter trips based on RBAC (RAB & National Police sees all, DARO/SARO sees origin/dest, District Police sees district)
      const allowedPlateNumbers = new Set();
      activeTrips.forEach(trip => {
        const req = trip.MovementRequest;
        if (!req) return;
        
        const isInitiator = req.initiator_id === user.id;
        const isApprover = req.approver_id === user.id;
        
        let isReceiver = false;
        if (req.type === 'DISTRICT_TO_DISTRICT') {
           isReceiver = user.role === 'DARO' && user.district_id && req.dest_district === user.district_id;
        } else if (req.type === 'SECTOR_TO_SECTOR') {
           isReceiver = user.role === 'SARO' && user.sector_id && req.dest_sector === user.sector_id;
        }

        const isDistrictPolice = user.role === 'POLICE' && user.district_id && user.district_id !== 'NATIONAL' && 
          (req.origin_district === user.district_id || req.dest_district === user.district_id);

        if (isNationalUser || isInitiator || isApprover || isReceiver || isDistrictPolice) {
          if (trip.plate_number) {
            allowedPlateNumbers.add(trip.plate_number.toUpperCase());
          }
        }
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
            const devPlate = (device.name || '').toUpperCase().trim();
            // Find matching trip or movement request for this device
            const trip = activeTrips.find(t => (t.plate_number || '').toUpperCase().trim() === devPlate);
            const req = trip?.MovementRequest || activeMovements.find(m => (m.plate_number || '').toUpperCase().trim() === devPlate);
            
            deviceMap[device.id] = {
              id: device.id,
              name: device.name,
              phone: device.phone,
              status: device.status,
              lastUpdate: device.lastUpdate,
              route: req ? {
                permitNumber: req.permit_number || `MVT-${String(req.id).substring(0, 8).toUpperCase()}`,
                originDistrict: req.origin_district || 'Nyagatare',
                originSector: req.origin_sector || '',
                destDistrict: req.dest_district || 'Gasabo',
                destSector: req.dest_sector || '',
                cargo: `${req.count || 1} ${req.animal_type || 'Livestock'}`,
                driverName: req.driver_name || trip?.driver_name || (req.Initiator ? req.Initiator.name : 'N/A'),
                driverPhone: req.driver_phone || trip?.driver_phone || (req.Initiator ? req.Initiator.phone : 'N/A'),
                ownerName: req.owner_name || 'N/A',
                status: trip?.status || req.status || 'ACTIVE'
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

            return {
              deviceId: pos.deviceId,
              deviceName: device.name || 'Unknown',
              devicePhone: device.phone || '',
              status: device.status || 'offline',
              lastUpdate: device.lastUpdate || pos.serverTime,
              latitude: pos.latitude,
              longitude: pos.longitude,
              speed: pos.speed,
              course: pos.course,
              attributes: pos.attributes,
              route: device.route,
              geofenceViolation: violation
            };
          })
      );

      return locations;
    } catch (error) {
      console.error('Error fetching GPS data:', error.message);
      throw new Error('Failed to fetch GPS tracking data');
    }
  }

  async getDeviceRoute(deviceId, from, to) {
    try {
      const res = await this.client.get('/api/reports/route', {
        params: {
          deviceId,
          from: new Date(from).toISOString(),
          to: new Date(to).toISOString()
        }
      });
      return res.data;
    } catch (error) {
      console.error(`Error fetching route for device ${deviceId}:`, error.message);
      return [];
    }
  }
}

module.exports = new TraccarService();
