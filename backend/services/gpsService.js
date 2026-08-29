const { GPSLog, Trip, MovementRequest, OTP } = require('../models');
const notificationService = require('./notificationService');
const otpService = require('./otpService');
const socketService = require('./socketService');

class GPSService {
  // Utility to calculate distance between two lat/lng coordinates (Haversine formula)
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in km
  }

  async logPosition(trip_id, lat, lng) {
    const trip = await Trip.findByPk(trip_id, { include: [MovementRequest] });
    if (!trip || trip.status !== 'ACTIVE') throw new Error('Trip is not active');

    const log = await GPSLog.create({
      trip_id,
      latitude: lat,
      longitude: lng,
      timestamp: new Date()
    });

    // Broadcast GPS update to live map
    const io = socketService.getIO();
    io.to(`trip_${trip_id}`).emit('gps_update', { trip_id, lat, lng });

    // --- Arrival Detection Logic (Geofencing) ---
    // In a real system, MovementRequest would have destination_lat and destination_lng.
    // For this mockup, we'll simulate arrival if a certain flag is passed or if distance < 0.5km.
    // Let's assume a mock destination coordinate for demonstration:
    const destLat = -1.9441; // Kigali mock
    const destLng = 30.0619;
    
    const distanceToDestination = this._calculateDistance(lat, lng, destLat, destLng);

    if (distanceToDestination < 1.0) { // Within 1 km
      // Check if OTP was already generated to avoid spamming
      const existingOTP = await OTP.findOne({ where: { trip_id, used: false } });
      
      if (!existingOTP) {
        // Vehicle reached destination!
        await notificationService.notifyUser(
          trip.MovementRequest.initiator_id, // In real life, notify the receiver (DARO/SARO of destination)
          `Vehicle for Trip ${trip_id} has arrived at destination. Generating OTP.`,
          'ARRIVAL'
        );

        // Generate OTP automatically
        await otpService.generateOTP(trip_id);
      }
    }

    return log;
  }
}

module.exports = new GPSService();
