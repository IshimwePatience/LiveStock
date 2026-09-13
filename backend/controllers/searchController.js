const { Op, Sequelize } = require('sequelize');
const { MovementRequest, Case, VetRecord, NotificationLog, User } = require('../models');

const globalSearch = async (req, res) => {
  try {
    const rawQuery = (req.query.q || '').trim();
    if (!rawQuery || rawQuery.length < 2) {
      return res.json({
        permits: [],
        cases: [],
        vetRecords: [],
        notifications: [],
        users: []
      });
    }

    const user = req.user;
    const qLower = rawQuery.toLowerCase();
    const searchPattern = `%${qLower}%`;

    // Safe helper for case-insensitive column match (casts ENUM/VARCHAR to text for PG safety)
    const lowerMatch = (colName) => Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.cast(Sequelize.col(colName), 'text')),
      { [Op.like]: searchPattern }
    );

    // 1. Session-based Permits search
    let permitWhere = {
      [Op.or]: [
        lowerMatch('permit_number'),
        lowerMatch('owner_name'),
        lowerMatch('driver_name'),
        lowerMatch('plate_number'),
        lowerMatch('origin_district'),
        lowerMatch('origin_sector'),
        lowerMatch('dest_district'),
        lowerMatch('dest_sector'),
        lowerMatch('animal_type'),
        lowerMatch('status')
      ]
    };
    if (user?.role === 'DARO' && user?.district_id) {
      permitWhere[Op.and] = [
        {
          [Op.or]: [
            { origin_district: user.district_id },
            { dest_district: user.district_id }
          ]
        }
      ];
    } else if (user?.role === 'SARO' && user?.sector_id) {
      permitWhere[Op.and] = [
        {
          [Op.or]: [
            { origin_sector: user.sector_id },
            { dest_sector: user.sector_id }
          ]
        }
      ];
    }

    const permitsPromise = MovementRequest.findAll({
      where: permitWhere,
      limit: 10,
      order: [['createdAt', 'DESC']]
    }).catch(err => {
      console.warn('Permit search warning:', err.message);
      return [];
    });

    // 2. Session-based Police Cases search
    let caseWhere = {
      [Op.or]: [
        lowerMatch('vehicle_plate'),
        lowerMatch('details'),
        lowerMatch('type'),
        lowerMatch('status')
      ]
    };
    if (user?.role === 'DARO' && user?.district_id) {
      caseWhere.details = { [Op.like]: `%${user.district_id}%` };
    } else if (user?.role === 'SARO' && user?.sector_id) {
      caseWhere.details = { [Op.like]: `%${user.sector_id}%` };
    }

    const casesPromise = Case.findAll({
      where: caseWhere,
      limit: 10,
      order: [['createdAt', 'DESC']]
    }).catch(err => {
      console.warn('Case search warning:', err.message);
      return [];
    });

    // 3. Session-based Vet Records search
    let vetWhere = {
      [Op.or]: [
        lowerMatch('animal_tag'),
        lowerMatch('animal_type'),
        lowerMatch('owner_name'),
        lowerMatch('vaccines'),
        lowerMatch('district'),
        lowerMatch('sector')
      ]
    };
    if (user?.role === 'DARO' && user?.district_id) {
      vetWhere.district = user.district_id;
    } else if (user?.role === 'SARO' && user?.sector_id) {
      vetWhere.sector = user.sector_id;
    }

    const vetRecordsPromise = VetRecord.findAll({
      where: vetWhere,
      limit: 10,
      order: [['createdAt', 'DESC']]
    }).catch(err => {
      console.warn('Vet record search warning:', err.message);
      return [];
    });

    // 4. Session-based Notifications search (strictly logged in user)
    const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const notificationsPromise = (user && isUUID(user.id)) ? NotificationLog.findAll({
      where: {
        user_id: user.id,
        [Op.or]: [
          lowerMatch('message'),
          lowerMatch('type')
        ]
      },
      limit: 10,
      order: [['createdAt', 'DESC']]
    }).catch(err => {
      console.warn('Notification search warning:', err.message);
      return [];
    }) : Promise.resolve([]);

    // 5. Session-based Registered Users search (RAB, DARO, SARO, POLICE)
    let userWhere = {
      [Op.or]: [
        lowerMatch('name'),
        lowerMatch('email'),
        lowerMatch('phone'),
        lowerMatch('role'),
        lowerMatch('district_id'),
        lowerMatch('sector_id')
      ]
    };

    if (user?.role === 'DARO' && user?.district_id) {
      userWhere.district_id = user.district_id;
    } else if (user?.role === 'SARO' && user?.sector_id) {
      userWhere.sector_id = user.sector_id;
    }

    const usersPromise = User.findAll({
      where: userWhere,
      attributes: ['id', 'name', 'email', 'phone', 'role', 'district_id', 'sector_id', 'status'],
      limit: 10,
      order: [['name', 'ASC']]
    }).catch(err => {
      console.warn('User search warning:', err.message);
      return [];
    });

    const [permits, cases, vetRecords, notifications, users] = await Promise.all([
      permitsPromise,
      casesPromise,
      vetRecordsPromise,
      notificationsPromise,
      usersPromise
    ]);

    res.json({
      permits,
      cases,
      vetRecords,
      notifications,
      users
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

module.exports = { globalSearch };
