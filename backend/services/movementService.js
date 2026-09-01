const { MovementRequest, MovementAnimal, User, Trip } = require('../models');
const notificationService = require('./notificationService');

class MovementService {
  
  // Data Access Rule Implementation
  _buildScopeFilter(user) {
    if (user.role === 'SARO') return { origin_id: user.sector_id };
    if (user.role === 'DARO') return { origin_id: user.district_id };
    return {}; // RAB sees all
  }

  async createRequest(user, data) {
    const { 
      type, origin_id, destination_id, animal_type, count, reason,
      owner_name, owner_id_number, owner_phone, priority, transport_type, plate_number,
      origin_district, origin_sector, origin_cell, origin_village,
      dest_district, dest_sector, dest_cell, dest_village,
      valid_until, animals,
      driver_name, driver_phone, driver_nid
    } = data;
    
    if (type === 'SECTOR_TO_SECTOR' && user.role !== 'SARO') {
      throw new Error('Only SARO can initiate sector-to-sector requests');
    }
    if (type === 'DISTRICT_TO_DISTRICT' && user.role !== 'DARO') {
      throw new Error('Only DARO can initiate district-to-district requests');
    }

    const timestamp = new Date().getTime().toString().slice(-6);
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const permit_number = `B${new Date().getFullYear().toString().slice(-2)}${timestamp}${randomChars}`;

    const request = await MovementRequest.create({
      type,
      initiator_id: user.id,
      origin_id,
      destination_id,
      animal_type,
      count,
      reason,
      status: 'PENDING',
      owner_name,
      owner_id_number,
      owner_phone,
      priority,
      transport_type,
      plate_number,
      origin_district,
      origin_sector,
      origin_cell,
      origin_village,
      dest_district,
      dest_sector,
      dest_cell,
      dest_village,
      permit_number,
      valid_until,
      driver_name,
      driver_phone,
      driver_nid,
      Animals: animals || []
    }, {
      include: [{ model: MovementAnimal, as: 'Animals' }]
    });

    return request;
  }

  async updateRequest(user, requestId, data) {
    const request = await MovementRequest.findByPk(requestId);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'PENDING') throw new Error('Can only edit pending requests');
    if (request.initiator_id !== user.id) throw new Error('Only the initiator can edit this request');

    const { 
      reason, owner_name, owner_id_number, owner_phone, priority, transport_type, plate_number,
      origin_district, origin_sector, origin_cell, origin_village,
      dest_district, dest_sector, dest_cell, dest_village,
      valid_until, animals, count,
      driver_name, driver_phone, driver_nid
    } = data;

    await request.update({
      reason, owner_name, owner_id_number, owner_phone, priority, transport_type, plate_number,
      origin_district, origin_sector, origin_cell, origin_village,
      dest_district, dest_sector, dest_cell, dest_village,
      valid_until, count,
      driver_name, driver_phone, driver_nid
    });

    if (animals) {
      await MovementAnimal.destroy({ where: { movement_request_id: request.id } });
      const newAnimals = animals.map(a => ({ ...a, movement_request_id: request.id }));
      await MovementAnimal.bulkCreate(newAnimals);
    }

    return request;
  }

  async getRequests(user) {
    const filter = this._buildScopeFilter(user);
    
    return await MovementRequest.findAll({
      where: filter,
      include: [
        { model: User, as: 'Initiator', attributes: ['name', 'email'] },
        { model: User, as: 'Approver', attributes: ['name', 'email'] },
        { model: MovementAnimal, as: 'Animals' },
        { model: Trip }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async approveRequest(user, requestId) {
    const request = await MovementRequest.findByPk(requestId);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'PENDING') throw new Error('Request already processed');

    if (request.type === 'SECTOR_TO_SECTOR' && user.role !== 'DARO') {
      throw new Error('Only DARO can approve sector-to-sector');
    }
    if (request.type === 'DISTRICT_TO_DISTRICT' && user.role !== 'RAB') {
      throw new Error('Only RAB can approve district-to-district');
    }

    request.status = 'APPROVED';
    request.approver_id = user.id;
    await request.save();

    const crypto = require('crypto');
    const driverToken = crypto.randomBytes(16).toString('hex');

    const trip = await Trip.create({
      request_id: request.id,
      status: 'ACTIVE',
      driver_name: request.driver_name,
      driver_phone: request.driver_phone,
      driver_national_id: request.driver_nid,
      plate_number: request.plate_number,
      driver_token: driverToken
    });

    // Notify Initiator and Approver
    const trackingLink = `/dashboard/gps?plate=${request.plate_number}`;
    await notificationService.notifyUser(
      request.initiator_id, 
      `Your movement request has been approved. Track your car: ${trackingLink}`, 
      'APPROVAL'
    );
    await notificationService.notifyUser(
      user.id, 
      `You approved a movement request. Track the car: ${trackingLink}`, 
      'APPROVAL'
    );

    // In a real system, send SMS to the driver here
    if (request.driver_phone) {
      console.log(`[SMS MOCK] To: ${request.driver_phone}, Message: You have been assigned a trip. Open this link to share GPS and see OTP: https://yourdomain.com/driver/trip/${driverToken}`);
    }

    return { request, trip };
  }

  async arriveTrip(user, requestId) {
    const request = await MovementRequest.findByPk(requestId, {
      include: [{ model: Trip }]
    });
    if (!request) throw new Error('Request not found');
    if (!request.Trip) throw new Error('Trip not found');
    if (request.Trip.status !== 'ACTIVE') throw new Error('Trip is not active');

    // Only destination officer can confirm arrival. Simplification for now: DARO or RAB.
    if (user.role !== 'DARO' && user.role !== 'RAB') {
      throw new Error('Only authorized officers can confirm arrival');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    
    request.Trip.status = 'ARRIVED';
    request.Trip.otp = otp;
    await request.Trip.save();

    return request.Trip;
  }

  async rejectRequest(user, requestId, reason) {
    const request = await MovementRequest.findByPk(requestId);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'PENDING') throw new Error('Request already processed');

    if (request.type === 'SECTOR_TO_SECTOR' && user.role !== 'DARO') {
      throw new Error('Only DARO can reject sector-to-sector');
    }
    if (request.type === 'DISTRICT_TO_DISTRICT' && user.role !== 'RAB') {
      throw new Error('Only RAB can reject district-to-district');
    }

    request.status = 'REJECTED';
    request.approver_id = user.id;
    request.reject_reason = reason;
    await request.save();

    // Notify Initiator
    await notificationService.notifyUser(
      request.initiator_id, 
      `Your movement request for ${request.animal_type} has been rejected. Reason: ${reason}`, 
      'REJECTION'
    );

    return request;
  }

  async revertRequest(user, requestId) {
    const request = await MovementRequest.findByPk(requestId);
    if (!request) throw new Error('Request not found');
    
    if (request.type === 'SECTOR_TO_SECTOR' && user.role !== 'DARO') {
      throw new Error('Only DARO can revert sector-to-sector');
    }
    if (request.type === 'DISTRICT_TO_DISTRICT' && user.role !== 'RAB') {
      throw new Error('Only RAB can revert district-to-district');
    }

    if (!['APPROVED', 'REJECTED'].includes(request.status)) {
      throw new Error('Can only revert approved or rejected requests');
    }

    if (request.status === 'APPROVED') {
       await Trip.destroy({ where: { request_id: request.id } });
    }

    request.status = 'PENDING';
    request.approver_id = null;
    request.reject_reason = null;
    await request.save();

    return request;
  }

  async getRequestById(user, requestId) {
    const request = await MovementRequest.findByPk(requestId, {
      include: [
        { model: User, as: 'Initiator', attributes: ['name', 'email'] },
        { model: User, as: 'Approver', attributes: ['name', 'email'] },
        { model: MovementAnimal, as: 'Animals' },
        { model: Trip }
      ]
    });
    if (!request) throw new Error('Request not found');
    return request;
  }
}

module.exports = new MovementService();
