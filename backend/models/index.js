const User = require('./User');
const District = require('./District');
const Sector = require('./Sector');
const MovementRequest = require('./MovementRequest');
const Trip = require('./Trip');
const GPSLog = require('./GPSLog');
const OTP = require('./OTP');
const VetRecord = require('./VetRecord');
const Case = require('./Case');
const NotificationLog = require('./NotificationLog');
const Animal = require('./Animal');
const { sequelize } = require('../config/db');

// --- Relationships ---

// Geography
District.hasMany(Sector, { foreignKey: 'district_id' });
Sector.belongsTo(District, { foreignKey: 'district_id' });

// Users
District.hasMany(User, { foreignKey: 'district_id' });
User.belongsTo(District, { foreignKey: 'district_id' });
Sector.hasMany(User, { foreignKey: 'sector_id' });
User.belongsTo(Sector, { foreignKey: 'sector_id' });

// Movement Requests
User.hasMany(MovementRequest, { foreignKey: 'initiator_id', as: 'InitiatedRequests' });
MovementRequest.belongsTo(User, { foreignKey: 'initiator_id', as: 'Initiator' });
User.hasMany(MovementRequest, { foreignKey: 'approver_id', as: 'ApprovedRequests' });
MovementRequest.belongsTo(User, { foreignKey: 'approver_id', as: 'Approver' });

// Trips
MovementRequest.hasOne(Trip, { foreignKey: 'request_id' });
Trip.belongsTo(MovementRequest, { foreignKey: 'request_id' });

// GPS Logs
Trip.hasMany(GPSLog, { foreignKey: 'trip_id' });
GPSLog.belongsTo(Trip, { foreignKey: 'trip_id' });

// OTPs
Trip.hasMany(OTP, { foreignKey: 'trip_id' });
OTP.belongsTo(Trip, { foreignKey: 'trip_id' });

// Vet Records
Trip.hasMany(VetRecord, { foreignKey: 'trip_id' });
VetRecord.belongsTo(Trip, { foreignKey: 'trip_id' });
User.hasMany(VetRecord, { foreignKey: 'saro_id' });
VetRecord.belongsTo(User, { foreignKey: 'saro_id' });

// Cases
User.hasMany(Case, { foreignKey: 'reporter_id' });
Case.belongsTo(User, { foreignKey: 'reporter_id' });
Trip.hasMany(Case, { foreignKey: 'trip_id' });
Case.belongsTo(Trip, { foreignKey: 'trip_id' });

// Notifications
User.hasMany(NotificationLog, { foreignKey: 'user_id' });
NotificationLog.belongsTo(User, { foreignKey: 'user_id' });

// Animals
Sector.hasMany(Animal, { foreignKey: 'sector_id' });
Animal.belongsTo(Sector, { foreignKey: 'sector_id' });

module.exports = {
  sequelize,
  User,
  District,
  Sector,
  MovementRequest,
  Trip,
  GPSLog,
  OTP,
  VetRecord,
  Case,
  NotificationLog,
  Animal
};
