const express = require('express');
const router = express.Router();
const traccarController = require('../controllers/traccarController');
const { protect } = require('../middleware/auth');

router.get('/locations', protect, traccarController.getLocations);
router.get('/route/:deviceId', protect, traccarController.getRoute);

module.exports = router;
