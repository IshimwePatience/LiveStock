const traccarService = require('../services/traccarService');

const getLocations = async (req, res) => {
  try {
    const locations = await traccarService.getLocations();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLocations
};
