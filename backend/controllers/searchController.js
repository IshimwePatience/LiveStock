const { Op } = require('sequelize');
const { MovementRequest, Case, VetRecord, NotificationLog, User } = require('../models');

const globalSearch = async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    if (!query || query.length < 2) {
      return res.json({
        permits: [],
        cases: [],
        vetRecords: [],
        notifications: [],
        users: []
      });
    }

    const user = req.user;
    const searchPattern = `%${query}%`;

    // 1. Session-based Permits search
    let permitWhere = {
      [Op.or]: [
        { permit_number: { [Op.like]: searchPattern } },
        { trader_name: { [Op.like]: searchPattern } },
        { origin_district: { [Op.like]: searchPattern } },
        { destination_district: { [Op.like]: searchPattern } },
        { status: { [Op.like]: searchPattern } }
      ]
    };
    if (user.role === 'DARO') {
      permitWhere[Op.and] = [
        {
          [Op.or]: [
            { origin_district: user.district_id },
            { destination_district: user.district_id }
          ]
        }
      ];
    } else if (user.role === 'SARO') {
      permitWhere[Op.and] = [
        {
          [Op.or]: [
            { origin_sector: user.sector_id },
            { destination_sector: user.sector_id }
          ]
        }
      ];
    }

    const permits = await MovementRequest.findAll({
      where: permitWhere,
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    // 2. Session-based Police Cases search
    let caseWhere = {
      [Op.or]: [
        { case_number: { [Op.like]: searchPattern } },
        { location: { [Op.like]: searchPattern } },
        { reason: { [Op.like]: searchPattern } },
        { status: { [Op.like]: searchPattern } }
      ]
    };
    if (user.role === 'DARO' && user.district_id) {
      caseWhere.district_id = user.district_id;
    } else if (user.role === 'SARO' && user.sector_id) {
      caseWhere.sector_id = user.sector_id;
    }

    const cases = await Case.findAll({
      where: caseWhere,
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    // 3. Session-based Vet Records search
    let vetWhere = {
      [Op.or]: [
        { tag_number: { [Op.like]: searchPattern } },
        { animal_type: { [Op.like]: searchPattern } },
        { diagnosis: { [Op.like]: searchPattern } },
        { vet_name: { [Op.like]: searchPattern } }
      ]
    };
    const vetRecords = await VetRecord.findAll({
      where: vetWhere,
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    // 4. Session-based Notifications search (strictly logged in user)
    const notifications = await NotificationLog.findAll({
      where: {
        user_id: user.id,
        message: { [Op.like]: searchPattern }
      },
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    // 5. Users search (only for RAB or DARO)
    let users = [];
    if (user.role === 'RAB' || user.role === 'DARO') {
      let userWhere = {
        [Op.or]: [
          { name: { [Op.like]: searchPattern } },
          { email: { [Op.like]: searchPattern } },
          { phone: { [Op.like]: searchPattern } },
          { role: { [Op.like]: searchPattern } },
          { district_id: { [Op.like]: searchPattern } }
        ]
      };
      if (user.role === 'DARO') {
        userWhere.district_id = user.district_id;
      }
      users = await User.findAll({
        where: userWhere,
        attributes: ['id', 'name', 'email', 'phone', 'role', 'district_id', 'sector_id', 'status'],
        limit: 5
      });
    }

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
