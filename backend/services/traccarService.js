const axios = require('axios');

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

  async getLocations() {
    try {
      const [devicesRes, positionsRes] = await Promise.all([
        this.client.get('/api/devices'),
        this.client.get('/api/positions')
      ]);

      const devices = devicesRes.data;
      const positions = positionsRes.data;

      // Map device IDs to positions
      const deviceMap = {};
      devices.forEach(device => {
        deviceMap[device.id] = {
          id: device.id,
          name: device.name,
          phone: device.phone,
          status: device.status,
          lastUpdate: device.lastUpdate
        };
      });

      const locations = positions.map(pos => {
        const device = deviceMap[pos.deviceId] || {};
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
          attributes: pos.attributes
        };
      });

      return locations;
    } catch (error) {
      console.error('Error fetching GPS data:', error.message);
      throw new Error('Failed to fetch GPS tracking data');
    }
  }
}

module.exports = new TraccarService();
