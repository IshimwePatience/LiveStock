const { VetRecord, User, Animal } = require('../models');

class VetService {
  _buildScopeFilter(user) {
    if (user.role === 'SARO') return { '$Animal.sector_id$': user.sector_id };
    if (user.role === 'DARO') return {}; // Could link through sectors to districts in a real DB view
    return {}; // RAB sees all
  }

  async addRecord(user, data) {
    if (user.role !== 'SARO') {
      throw new Error('Only SARO can record veterinary treatments');
    }
    
    // Support bulk creation for home vaccinations
    if (data.records && Array.isArray(data.records)) {
      const recordsToCreate = data.records.map(r => ({
        ...r,
        saro_id: user.id,
        district: r.district || user.district_id,
        sector: r.sector || user.sector_id
      }));
      return await VetRecord.bulkCreate(recordsToCreate);
    }

    // Legacy single creation support
    const record = await VetRecord.create({
      ...data,
      saro_id: user.id
    });

    return record;
  }

  async getRecords(user) {
    let filter = {};
    if (user.role === 'SARO') {
      filter = { saro_id: user.id };
    } else if (user.role === 'DARO') {
      filter = { district: user.district_id };
    }

    return await VetRecord.findAll({
      where: filter,
      include: [{ model: User, as: 'Veterinarian', attributes: ['name', 'role'] }],
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = new VetService();
