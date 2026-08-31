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
      valid_until, animals 
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
      valid_until, animals, count 
    } = data;

    await request.update({
      reason, owner_name, owner_id_number, owner_phone, priority, transport_type, plate_number,
      origin_district, origin_sector, origin_cell, origin_village,
      dest_district, dest_sector, dest_cell, dest_village,
      valid_until, count
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
        { model: User, as: 'Approver', attributes: ['name', 'email'] }
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

    const trip = await Trip.create({
      request_id: request.id,
      status: 'ACTIVE'
    });

    // Notify Initiator
    await notificationService.notifyUser(
      request.initiator_id, 
      `Your movement request for ${request.animal_type} has been approved.`, 
      'APPROVAL'
    );

    return { request, trip };
  }

  async getRequestById(user, requestId) {
    const request = await MovementRequest.findByPk(requestId, {
      include: [
        { model: User, as: 'Initiator', attributes: ['name', 'email'] },
        { model: User, as: 'Approver', attributes: ['name', 'email'] },
        { model: MovementAnimal, as: 'Animals' }
      ]
    });
    if (!request) throw new Error('Request not found');
    return request;
  }
}

module.exports = new MovementService();
