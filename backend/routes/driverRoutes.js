const express = require('express');
const router = express.Router();
const { getTripByToken, startTrip, updateLocation, submitOTP } = require('../controllers/driverController');

router.get('/:token', getTripByToken);
router.post('/:token/start', startTrip);
router.post('/:token/location', updateLocation);
router.post('/:token/otp', submitOTP);

module.exports = router;
