const { Case, User, sequelize } = require('../models');
const notificationService = require('./notificationService');

let columnsEnsured = false;
async function ensureCaseColumns() {
  if (columnsEnsured) return;
  try {
    // 1. Add new enum values to Postgres ENUM if column is still ENUM
    const newEnums = ['VEHICLE_CLAIM', 'UNAUTHORIZED_MOVEMENT', 'GEOFENCE_VIOLATION', 'ILLEGAL_TRANSPORT', 'OTHER'];
    for (const val of newEnums) {
      await sequelize.query(`ALTER TYPE "enum_Cases_type" ADD VALUE IF NOT EXISTS '${val}';`).catch(() => {});
    }

    // 2. Convert ENUM column to VARCHAR so any string can be stored
    await sequelize.query('ALTER TABLE "Cases" ALTER COLUMN type TYPE VARCHAR(255) USING type::VARCHAR;').catch(() => {});
    await sequelize.query('ALTER TABLE "Cases" ALTER COLUMN status TYPE VARCHAR(255) USING status::VARCHAR;').catch(() => {});

    // 3. Add missing columns
    await sequelize.query('ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;').catch(() => {});
    await sequelize.query('ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS location TEXT;').catch(() => {});

    columnsEnsured = true;
  } catch (err) {
    console.error('Failed to alter Cases table columns:', err.message);
  }
}

// Run at module load
ensureCaseColumns();

class CaseService {
  _buildScopeFilter(user) {
    if (user.role === 'POLICE' || user.role === 'RAB') return {};
    return { reporter_id: user.id };
  }

  async createCase(user, data) {
    await ensureCaseColumns();
    const { type, trip_id, vehicle_plate, location, details } = data;

    let newCase;
    try {
      newCase = await Case.create({
        type: type || 'VEHICLE_CLAIM',
        reporter_id: user.id,
        trip_id: trip_id || null,
        vehicle_plate: vehicle_plate ? vehicle_plate.trim().toUpperCase() : null,
        location: location || null,
        details: details || `Vehicle ${vehicle_plate || ''} claimed by ${user.name}`,
        status: 'OPEN'
      });
    } catch (err) {
      console.warn('Primary Case.create failed, executing fallback insert:', err.message);
      newCase = await Case.create({
        type: 'THEFT',
        reporter_id: user.id,
        trip_id: trip_id || null,
        vehicle_plate: vehicle_plate ? vehicle_plate.trim().toUpperCase() : null,
        location: location || null,
        details: `[${type || 'VEHICLE_CLAIM'}] ${details || `Vehicle ${vehicle_plate || ''} claimed by ${user.name}`}`,
        status: 'OPEN'
      });
    }

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
    await ensureCaseColumns();
    const filter = this._buildScopeFilter(user);

    return await Case.findAll({
      where: filter,
      include: [
        { model: User, attributes: ['name', 'role'] }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async updateCaseStatus(user, caseId, status) {
    await ensureCaseColumns();
    const item = await Case.findByPk(caseId);
    if (!item) throw new Error('Case not found');

    item.status = status;
    await item.save();

    // Send notifications to the person who reported/claimed the case AND to all officers!
    try {
      const plateStr = item.vehicle_plate ? ` for Vehicle ${item.vehicle_plate}` : '';
      const notifMsg = `📢 CASE STATUS UPDATE: Case ${item.id.substring(0, 8).toUpperCase()}${plateStr} status updated to '${status}' by ${user.name}.`;

      if (item.reporter_id) {
        await notificationService.notifyUser(item.reporter_id, notifMsg, 'ALERT');
      }
      await notificationService.notifyRoles(['RAB', 'POLICE', 'ADMIN'], notifMsg, 'ALERT');
    } catch (err) {
      console.error('Failed to send status update notification:', err.message);
    }

    return item;
  }
}

module.exports = new CaseService();
