const traccarService = require('../services/traccarService');

const getLocations = async (req, res) => {
  try {
    const locations = await traccarService.getLocations(req.user);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getRoute = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { from, to } = req.query;
    
    if (!deviceId || !from || !to) {
      return res.status(400).json({ message: 'Missing deviceId, from, or to parameters' });
    }

    const route = await traccarService.getDeviceRoute(deviceId, from, to);
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLocations,
  getRoute
};
