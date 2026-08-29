const crypto = require('crypto');
const { OTP, Trip, MovementRequest } = require('../models');

class OTPService {
  async generateOTP(tripId) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw new Error('Trip not found');
    
    const code = crypto.randomInt(100000, 999999).toString();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const otp = await OTP.create({ trip_id: tripId, code, expires_at });
    // Real life: Send via SMS to SARO/DARO responsible for arrival destination
    return otp.code;
  }

  async verifyOTP(user, trip_id, code) {
    // 1. Enforce scoping rule for who can verify (DARO confirms district-to-district, SARO confirms sector-to-sector)
    const trip = await Trip.findByPk(trip_id, { include: [MovementRequest] });
    if (!trip) throw new Error('Trip not found');

    const request = trip.MovementRequest;
    if (request.type === 'DISTRICT_TO_DISTRICT' && user.role !== 'DARO') {
      throw new Error('Only DARO can confirm district-to-district arrivals');
    }
    if (request.type === 'SECTOR_TO_SECTOR' && user.role !== 'SARO') {
      throw new Error('Only SARO can confirm sector-to-sector arrivals');
    }

    // 2. Validate OTP
    const otpRecord = await OTP.findOne({ where: { trip_id, code, used: false } });
    if (!otpRecord) throw new Error('Invalid or expired OTP');
    if (new Date() > otpRecord.expires_at) throw new Error('OTP expired');

    // 3. Mark as used and update trip
    otpRecord.used = true;
    await otpRecord.save();

    trip.status = 'CONFIRMED';
    await trip.save();

    request.status = 'COMPLETED';
    await request.save();

    return trip;
  }
}

module.exports = new OTPService();
