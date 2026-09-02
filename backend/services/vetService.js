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
      if (data.deleteIds && Array.isArray(data.deleteIds) && data.deleteIds.length > 0) {
        await VetRecord.destroy({ where: { id: data.deleteIds, saro_id: user.id } });
      }

      const recordsToCreate = data.records.map(r => ({
        ...r,
        saro_id: user.id,
        district: r.district || user.district_id,
        sector: r.sector || user.sector_id
      }));

      // Validate all records have animal_tag
      const missing = recordsToCreate.filter(r => !r.animal_tag || r.animal_tag.trim() === '');
      if (missing.length > 0) {
        throw new Error(`Ear Tag is required for all animals. Missing for: ${missing.map(r => r.animal_type || 'unknown animal').join(', ')}`);
      }

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
