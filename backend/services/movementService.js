const { MovementRequest, MovementAnimal, User, Trip } = require('../models');
const notificationService = require('./notificationService');

class MovementService {
  
  // Data Access Rule Implementation
  _buildScopeFilter(user) {
    const { Op } = require('sequelize');
    if (user.role === 'SARO' && user.sector_id) {
      return {
        [Op.or]: [
          { origin_sector: user.sector_id },
          { dest_sector: user.sector_id },
          { origin_id: user.sector_id },
          { destination_id: user.sector_id },
          { initiator_id: user.id }
        ]
      };
    }
    if (user.role === 'DARO' && user.district_id) {
      return {
        [Op.or]: [
          { origin_district: user.district_id },
          { dest_district: user.district_id },
          { origin_id: user.district_id },
          { destination_id: user.district_id },
          { initiator_id: user.id }
        ]
      };
    }
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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const trip = await Trip.create({
      request_id: request.id,
      status: 'ACTIVE',
      driver_name: request.driver_name,
      driver_phone: request.driver_phone,
      driver_national_id: request.driver_nid,
      plate_number: request.plate_number,
      driver_token: driverToken,
      otp: otp
    });

    // Notify Initiator and Approver
    const trackingLink = `/dashboard/gps?plate=${request.plate_number}`;
    const driverLink = `/driver/trip/${driverToken}`;
    
    await notificationService.notifyUser(
      request.initiator_id, 
      `Your movement request has been approved. Share this tracking link with the driver: ${driverLink} . The Arrival Confirmation OTP is: ${otp} . Track your car here: ${trackingLink}`, 
      'APPROVAL'
    );
    await notificationService.notifyUser(
      user.id, 
      `You approved a movement request. Track the car: ${trackingLink}`, 
      'APPROVAL'
    );

    // Notify Destination users about the OTP
    let destUsers = [];
    if (request.type === 'DISTRICT_TO_DISTRICT') {
      destUsers = await User.findAll({ where: { role: 'DARO', district_id: request.dest_district } });
    } else if (request.type === 'SECTOR_TO_SECTOR') {
      destUsers = await User.findAll({ where: { role: 'SARO', sector_id: request.dest_sector } });
    }

    for (const destUser of destUsers) {
      await notificationService.notifyUser(
        destUser.id,
        `A livestock trip is heading to your jurisdiction. The arrival confirmation OTP is: ${otp}`,
        'SYSTEM'
      );
    }

    // In a real system, send SMS to the driver here
    if (request.driver_phone) {
      console.log(`[SMS MOCK] To: ${request.driver_phone}, Message: You have been assigned a trip. Open this link to share GPS and see OTP: https://yourdomain.com/driver/trip/${driverToken}`);
    }

    return { request, trip };
  }

  async arriveTrip(user, requestId, otp) {
    const request = await MovementRequest.findByPk(requestId, {
      include: [{ model: Trip }]
    });
    if (!request) throw new Error('Request not found');
    if (!request.Trip) throw new Error('Trip not found');
    if (request.Trip.status !== 'ACTIVE' && request.Trip.status !== 'IN_PROGRESS') throw new Error('Trip is not active');

    if (user.role !== 'DARO' && user.role !== 'SARO' && user.role !== 'RAB') {
      throw new Error('Only authorized officers can confirm arrival');
    }

    if (otp && request.Trip.otp && String(request.Trip.otp).trim() !== String(otp).trim()) {
      throw new Error('Invalid OTP code. Please check the driver\'s OTP and try again.');
    }
    
    request.Trip.status = 'ARRIVED';
    await request.Trip.save();

    request.status = 'COMPLETED';
    await request.save();

    await notificationService.notifyUser(
      request.initiator_id,
      `Movement Permit ${request.permit_number} has arrived at destination (${request.dest_district || request.destination_id}).`,
      'SYSTEM'
    );

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
