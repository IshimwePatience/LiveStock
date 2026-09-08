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
      driver_name, driver_phone, driver_nid,
      buyer_type, buyer_name, buyer_phone, buyer_id_tin,
      transporter_mode, cargo_photo
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
      buyer_type,
      buyer_name,
      buyer_phone,
      buyer_id_tin,
      transporter_mode,
      cargo_photo,
      Animals: animals || []
    }, {
      include: [{ model: MovementAnimal, as: 'Animals' }]
    });

    // Send notifications to RAB and relevant DARO/SARO officers
    try {
      const { Op } = require('sequelize');
      const notifMsg = `📋 NEW MOVEMENT REQUEST: Permit #${permit_number} submitted by ${user.name} for ${count} ${animal_type}(s) [${origin_district || origin_sector || 'Origin'} ➔ ${dest_district || dest_sector || 'Destination'}]. Status: PENDING approval.`;
      
      // Always notify RAB & ADMIN
      await notificationService.notifyRoles(['RAB', 'ADMIN'], notifMsg, 'SYSTEM');

      // Target specific DARO / SARO officers in origin or destination jurisdictions
      if (type === 'SECTOR_TO_SECTOR') {
        const saroUsers = await User.findAll({
          where: {
            role: 'SARO',
            sector_id: { [Op.in]: [origin_sector, dest_sector].filter(Boolean) }
          }
        });
        for (const u of saroUsers) {
          if (u.id !== user.id) {
            await notificationService.notifyUser(u.id, notifMsg, 'SYSTEM');
          }
        }
      } else if (type === 'DISTRICT_TO_DISTRICT') {
        const daroUsers = await User.findAll({
          where: {
            role: 'DARO',
            district_id: { [Op.in]: [origin_district, dest_district].filter(Boolean) }
          }
        });
        for (const u of daroUsers) {
          if (u.id !== user.id) {
            await notificationService.notifyUser(u.id, notifMsg, 'SYSTEM');
          }
        }
      }
    } catch (err) {
      console.error('Failed to send permit creation notification:', err.message);
    }

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
      driver_name, driver_phone, driver_nid,
      buyer_type, buyer_name, buyer_phone, buyer_id_tin,
      transporter_mode, cargo_photo
    } = data;

    await request.update({
      reason, owner_name, owner_id_number, owner_phone, priority, transport_type, plate_number,
      origin_district, origin_sector, origin_cell, origin_village,
      dest_district, dest_sector, dest_cell, dest_village,
      valid_until, count,
      driver_name, driver_phone, driver_nid,
      buyer_type, buyer_name, buyer_phone, buyer_id_tin,
      transporter_mode, cargo_photo
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

    // Ensure valid_until is set to 7 days in the future if missing or in the past
    const now = new Date();
    if (!request.valid_until || new Date(request.valid_until) < now) {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      request.valid_until = future;
    }

    await request.save();

    const crypto = require('crypto');
    const driverToken = crypto.randomBytes(16).toString('hex');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const trip = await Trip.create({
      request_id: request.id,
      status: 'SCHEDULED',
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

    // Notify RAB & ADMIN of permit approval
    try {
      const rabMsg = `✅ PERMIT APPROVED: Movement permit #${request.permit_number} (${request.animal_type}) approved by ${user.name}. Active trip tracking enabled for plate ${request.plate_number || 'N/A'}.`;
      await notificationService.notifyRoles(['RAB', 'ADMIN'], rabMsg, 'APPROVAL');
    } catch (err) {
      console.error('Failed to notify RAB of approval:', err.message);
    }

    return { request, trip };
  }

  async startTrip(user, requestId) {
    const request = await MovementRequest.findByPk(requestId, {
      include: [{ model: Trip }]
    });
    if (!request) throw new Error('Request not found');
    if (!request.Trip) throw new Error('Trip not found');

    request.Trip.status = 'ACTIVE';
    await request.Trip.save();

    request.status = 'ACTIVE';
    await request.save();

    const origin = request.origin_sector || request.origin_district || 'Origin';
    const dest = request.dest_sector || request.dest_district || 'Destination';
    const notifMsg = `🚚 TRIP STARTED / DEPARTED: Vehicle ${request.plate_number || 'N/A'} (Driver: ${request.driver_name || 'Driver'}) has departed from ${origin} heading to ${dest}!`;

    try {
      await notificationService.notifyRoles(['RAB', 'ADMIN'], notifMsg, 'TRIP_DEPARTED');
      if (request.initiator_id) {
        await notificationService.notifyUser(request.initiator_id, notifMsg, 'TRIP_DEPARTED');
      }
    } catch (err) {
      console.error('Failed to send trip departure notification:', err.message);
    }

    return request.Trip;
  }

  async arriveTrip(user, requestId, otp) {
    const request = await MovementRequest.findByPk(requestId, {
      include: [{ model: Trip }]
    });
    if (!request) throw new Error('Request not found');
    if (!request.Trip) throw new Error('Trip not found');
    if (request.Trip.status !== 'ACTIVE' && request.Trip.status !== 'IN_PROGRESS' && request.Trip.status !== 'SCHEDULED') throw new Error('Trip is not active');

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

    // Notify RAB & ADMIN of trip arrival
    try {
      const rabMsg = `🏁 TRIP COMPLETED: Movement permit #${request.permit_number} (${request.animal_type}) arrived safely at destination (${request.dest_district || request.dest_sector || 'Destination'}).`;
      await notificationService.notifyRoles(['RAB', 'ADMIN'], rabMsg, 'ARRIVAL');
    } catch (err) {
      console.error('Failed to notify RAB of arrival:', err.message);
    }

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

    // Notify RAB & ADMIN of rejection
    try {
      const rabMsg = `❌ PERMIT REJECTED: Movement permit #${request.permit_number} (${request.animal_type}) rejected by ${user.name}. Reason: ${reason}`;
      await notificationService.notifyRoles(['RAB', 'ADMIN'], rabMsg, 'ALERT');
    } catch (err) {
      console.error('Failed to notify RAB of rejection:', err.message);
    }

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
