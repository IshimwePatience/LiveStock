const { Case, User } = require('../models');
const notificationService = require('./notificationService');

class CaseService {
  _buildScopeFilter(user) {
    if (user.role === 'POLICE' || user.role === 'RAB') return {};
    return { reporter_id: user.id };
  }

  async createCase(user, data) {
    const { type, trip_id, vehicle_plate, location, details } = data;
    try { await Case.sync(); } catch (e) {}

    const newCase = await Case.create({
      type: type || 'VEHICLE_CLAIM',
      reporter_id: user.id,
      trip_id: trip_id || null,
      vehicle_plate: vehicle_plate ? vehicle_plate.trim().toUpperCase() : null,
      location: location || null,
      details: details || `Vehicle ${vehicle_plate || ''} claimed by ${user.name}`,
      status: 'OPEN'
    });

    // Notify RAB, Police & Admin about the new police case
    try {
      const plateStr = vehicle_plate ? `for Vehicle ${vehicle_plate.toUpperCase()}` : '';
      const typeLabel = type ? type.replace(/_/g, ' ') : 'VEHICLE CLAIM';
      const notifMsg = `🚨 POLICE CASE FILED: ${user.name} reported [${typeLabel}] ${plateStr}. ${details ? `Details: ${details}` : ''}`;
      await notificationService.notifyRoles(['RAB', 'POLICE', 'ADMIN'], notifMsg, 'ALERT');
    } catch (err) {
      console.error('Failed to send case creation notification:', err.message);
    }

    return newCase;
  }

  async getCases(user) {
    try { await Case.sync(); } catch (e) {}
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
