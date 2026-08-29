const express = require('express');
const router = express.Router();
const { logPosition } = require('../controllers/gpsController');
const { protect } = require('../middleware/auth');

// This would usually be called by a mobile app pushing coordinates
router.post('/log', protect, logPosition);

module.exports = router;
