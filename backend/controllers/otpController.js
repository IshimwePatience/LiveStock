const otpService = require('../services/otpService');

const generateOTP = async (req, res) => {
  try {
    const code = await otpService.generateOTP(req.params.tripId);
    res.json({ message: 'OTP generated', otp: code });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const trip = await otpService.verifyOTP(req.user, req.body.trip_id, req.body.code);
    res.json({ message: 'Trip confirmed successfully', trip });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { generateOTP, verifyOTP };
