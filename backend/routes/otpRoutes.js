const express = require('express');
const router = express.Router();
const { generateOTP, verifyOTP } = require('../controllers/otpController');
const { protect, authorize } = require('../middleware/auth');

router.post('/generate/:tripId', protect, generateOTP); // Would be automated ideally
router.post('/verify', protect, authorize('DARO', 'SARO'), verifyOTP);

module.exports = router;
