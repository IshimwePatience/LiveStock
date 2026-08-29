const gpsService = require('../services/gpsService');

const logPosition = async (req, res) => {
  try {
    const { trip_id, lat, lng } = req.body;
    const log = await gpsService.logPosition(trip_id, lat, lng);
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { logPosition };
