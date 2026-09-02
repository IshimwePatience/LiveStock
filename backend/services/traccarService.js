const axios = require('axios');
const { Trip, MovementRequest, User } = require('../models');

class TraccarService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.TRACCAR_API_URL,
      auth: {
        username: process.env.TRACCAR_USERNAME,
        password: process.env.TRACCAR_PASSWORD
      },
      timeout: 10000 // 10s timeout
    });
  }

  async getLocations(user) {
    try {
      // 1. Get all active trips
      const activeTrips = await Trip.findAll({
        where: { status: 'ACTIVE' },
        include: [{ 
          model: MovementRequest,
          include: [{ model: User, as: 'Initiator' }]
        }]
      });

      // 2. Filter trips based on RBAC (RAB sees all, DARO/SARO sees origin/dest, Initiator sees it)
      const allowedPlateNumbers = new Set();
      activeTrips.forEach(trip => {
        const req = trip.MovementRequest;
        
        const isInitiator = req.initiator_id === user.id;
        const isApprover = req.approver_id === user.id;
        
        let isReceiver = false;
        if (req.type === 'DISTRICT_TO_DISTRICT') {
           isReceiver = user.role === 'DARO' && user.district_id && req.dest_district === user.district_id;
        } else if (req.type === 'SECTOR_TO_SECTOR') {
           isReceiver = user.role === 'SARO' && user.sector_id && req.dest_sector === user.sector_id;
        }

        if (user.role === 'RAB' || isInitiator || isApprover || isReceiver) {
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
        if (user.role === 'RAB' || allowedPlateNumbers.has(device.name.toUpperCase())) {
            // Find matching trip for this device
            const trip = activeTrips.find(t => t.plate_number?.toUpperCase() === device.name.toUpperCase());
            const req = trip?.MovementRequest;
            
            deviceMap[device.id] = {
              id: device.id,
              name: device.name,
              phone: device.phone,
              status: device.status,
              lastUpdate: device.lastUpdate,
              route: req ? {
                originDistrict: req.origin_district,
                originSector: req.origin_sector,
                destDistrict: req.dest_district,
                destSector: req.dest_sector,
                initiator: req.Initiator ? req.Initiator.name : 'Unknown'
              } : null
            };
        }
      });

      const locations = positions
        .filter(pos => deviceMap[pos.deviceId])
        .map(pos => {
          const device = deviceMap[pos.deviceId];
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
            route: device.route
          };
        });

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
