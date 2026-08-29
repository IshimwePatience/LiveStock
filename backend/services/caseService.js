const { Case, User } = require('../models');

class CaseService {
  _buildScopeFilter(user) {
    // Police sees all cases globally OR we could scope it to their district if required.
    // Assuming Police sees everything related to crime, but let's scope if they are tied to a district
    if (user.role === 'POLICE' && user.district_id) {
      // Find cases reported in their district
      // For simplicity, we just return all cases for police, or filter by reporter's district
      return {}; 
    }
    if (user.role === 'RAB') return {};
    
    // SARO/DARO only see cases they reported
    return { reporter_id: user.id };
  }

  async createCase(user, data) {
    const { type, trip_id, details } = data;

    const newCase = await Case.create({
      type,
      reporter_id: user.id,
      trip_id: trip_id || null,
      details,
      status: 'OPEN'
    });

    return newCase;
  }

  async getCases(user) {
    const filter = this._buildScopeFilter(user);

    return await Case.findAll({
      where: filter,
      include: [
        { model: User, attributes: ['name', 'role'] }
      ],
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = new CaseService();
