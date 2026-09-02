const analyticsService = require('../services/analyticsService');

const getOverviewStats = async (req, res) => {
  try {
    const stats = await analyticsService.getOverviewStats(req.user);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats(req.user);
    res.json(stats);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getOverviewStats };
