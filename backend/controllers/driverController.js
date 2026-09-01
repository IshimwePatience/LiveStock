const { Trip, MovementRequest } = require('../models');

const getTripByToken = async (req, res) => {
  try {
    const trip = await Trip.findOne({ 
      where: { driver_token: req.params.token },
    });
    
    if (!trip) {
      return res.status(404).json({ message: 'Invalid or expired link' });
    }
    
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const trip = await Trip.findOne({ where: { driver_token: req.params.token } });
    
    if (!trip) {
      return res.status(404).json({ message: 'Invalid or expired link' });
    }
    
    if (trip.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Trip is no longer active' });
    }
    
    trip.current_lat = lat;
    trip.current_lng = lng;
    await trip.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const trip = await Trip.findOne({ where: { driver_token: req.params.token } });
    
    if (!trip) {
      return res.status(404).json({ message: 'Invalid or expired link' });
    }
    
    if (trip.status !== 'ARRIVED') {
      return res.status(400).json({ message: 'Trip is not in ARRIVED status' });
    }
    
    if (trip.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    trip.status = 'CONFIRMED';
    trip.driver_token = null; // Expire the token
    await trip.save();
    
    const request = await MovementRequest.findByPk(trip.request_id);
    if (request) {
      request.status = 'COMPLETED';
      await request.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTripByToken, updateLocation, submitOTP };
