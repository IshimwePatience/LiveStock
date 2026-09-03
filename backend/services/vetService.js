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
  async checkTag(tag) {
    const { Op } = require('sequelize');
    const records = await VetRecord.findAll({
      where: { animal_tag: tag },
      order: [['createdAt', 'DESC']]
    });

    if (!records || records.length === 0) {
      return { found: false, vaccinated: false, antibioticActive: false, daysRemaining: 0 };
    }

    // Check vaccination — any VACCINATION record means vaccinated
    const vaccinated = records.some(r => r.type === 'VACCINATION');

    // Check antibiotic withdrawal — find the latest MEDICATION with withdrawal_period_end still in future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeAntibiotic = records
      .filter(r => r.type === 'MEDICATION' && r.withdrawal_period_end)
      .map(r => ({ ...r.toJSON(), endDate: new Date(r.withdrawal_period_end) }))
      .filter(r => r.endDate >= today)
      .sort((a, b) => b.endDate - a.endDate)[0];

    const antibioticActive = !!activeAntibiotic;
    const daysRemaining = activeAntibiotic
      ? Math.ceil((activeAntibiotic.endDate - today) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      found: true,
      vaccinated,
      antibioticActive,
      daysRemaining,
      antibiotic: activeAntibiotic?.vaccines || null,
      withdrawalEnd: activeAntibiotic?.withdrawal_period_end || null
    };
  }
}

module.exports = new VetService();
