const analyticsService = require('../services/analyticsService');

const getDashboardStats = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats(req.user);
    res.json(stats);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
