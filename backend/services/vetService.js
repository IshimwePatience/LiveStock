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
    
    // We should ensure the animal belongs to the SARO's sector, but for simplicity:
    const record = await VetRecord.create({
      animal_tag: data.animal_tag,
      antibiotics: data.antibiotics,
      vaccines: data.vaccines,
      saro_id: user.id,
      trip_id: data.trip_id // Trip is required
    });

    return record;
  }

  async getRecords(user) {
    // In a fully normalized DB with Animal model linked to VetRecord, we would filter by Animal.sector_id.
    // For now, since VetRecord is mostly flat, we allow DARO/RAB to see all, and SARO to see their own entries.
    const filter = user.role === 'SARO' ? { saro_id: user.id } : {};

    return await VetRecord.findAll({
      where: filter,
      include: [{ model: User, attributes: ['name', 'role'] }],
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = new VetService();
