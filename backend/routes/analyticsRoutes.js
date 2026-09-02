const express = require('express');
const router = express.Router();
const { getDashboardStats, getOverviewStats } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/overview-stats', protect, getOverviewStats);
router.get('/dashboard', protect, authorize('RAB'), getDashboardStats);

module.exports = router;
