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

    // Helper for case-insensitive column match
    const lowerMatch = (colName) => Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col(colName)),
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
    if (user.role === 'DARO' && user.district_id) {
      permitWhere[Op.and] = [
        {
          [Op.or]: [
            { origin_district: user.district_id },
            { dest_district: user.district_id }
          ]
        }
      ];
    } else if (user.role === 'SARO' && user.sector_id) {
      permitWhere[Op.and] = [
        {
          [Op.or]: [
            { origin_sector: user.sector_id },
            { dest_sector: user.sector_id }
          ]
        }
      ];
    }

    const permits = await MovementRequest.findAll({
      where: permitWhere,
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    // 2. Session-based Police Cases search
    let caseWhere = {
      [Op.or]: [
        lowerMatch('vehicle_plate'),
        lowerMatch('location'),
        lowerMatch('details'),
        lowerMatch('type'),
        lowerMatch('status')
      ]
    };
    if (user.role === 'DARO' && user.district_id) {
      caseWhere.location = { [Op.like]: `%${user.district_id}%` };
    } else if (user.role === 'SARO' && user.sector_id) {
      caseWhere.location = { [Op.like]: `%${user.sector_id}%` };
    }

    const cases = await Case.findAll({
      where: caseWhere,
      limit: 10,
      order: [['createdAt', 'DESC']]
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
    if (user.role === 'DARO' && user.district_id) {
      vetWhere.district = user.district_id;
    } else if (user.role === 'SARO' && user.sector_id) {
      vetWhere.sector = user.sector_id;
    }

    const vetRecords = await VetRecord.findAll({
      where: vetWhere,
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    // 4. Session-based Notifications search (strictly logged in user)
    const notifications = await NotificationLog.findAll({
      where: {
        user_id: user.id,
        [Op.or]: [
          lowerMatch('message'),
          lowerMatch('type')
        ]
      },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

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

    if (user.role === 'DARO' && user.district_id) {
      userWhere.district_id = user.district_id;
    } else if (user.role === 'SARO' && user.sector_id) {
      userWhere.sector_id = user.sector_id;
    }

    const users = await User.findAll({
      where: userWhere,
      attributes: ['id', 'name', 'email', 'phone', 'role', 'district_id', 'sector_id', 'status'],
      limit: 10,
      order: [['name', 'ASC']]
    });

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
