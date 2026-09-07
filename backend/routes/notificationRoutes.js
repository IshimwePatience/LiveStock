const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { NotificationLog, Case } = require('../models');

// Get all notifications for the user
router.get('/', protect, async (req, res) => {
  try {
    const { Op } = require('sequelize');

    // Build role-based scope filter for movement permits backfill
    let scopeFilter = {};
    if (req.user.role === 'SARO' && req.user.sector_id) {
      scopeFilter = {
        [Op.or]: [
          { origin_sector: req.user.sector_id },
          { dest_sector: req.user.sector_id },
          { origin_id: req.user.sector_id },
          { destination_id: req.user.sector_id },
          { initiator_id: req.user.id }
        ]
      };
    } else if (req.user.role === 'DARO' && req.user.district_id) {
      scopeFilter = {
        [Op.or]: [
          { origin_district: req.user.district_id },
          { dest_district: req.user.district_id },
          { origin_id: req.user.district_id },
          { destination_id: req.user.district_id },
          { initiator_id: req.user.id }
        ]
      };
    }

    let notifications = await NotificationLog.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // If existing notifications contain out-of-scope backfill data for SARO/DARO, purge them so they get re-backfilled cleanly
    if (notifications.length > 0 && (req.user.role === 'SARO' || req.user.role === 'DARO')) {
      const userLoc = req.user.role === 'SARO' ? req.user.sector_id : req.user.district_id;
      const isIrrelevant = notifications.some(n => {
        if (!n.message) return false;
        const match = n.message.match(/\[(.*?)(?:➔|->|\s+to\s+)(.*?)\]/);
        if (match && userLoc) {
          const origin = match[1];
          const dest = match[2];
          return !origin.includes(userLoc) && !dest.includes(userLoc);
        }
        return false;
      });

      if (isIrrelevant) {
        await NotificationLog.destroy({ where: { user_id: req.user.id } });
        notifications = [];
      }
    }

    // Auto-populate past notifications for officers if no notification logs exist yet
    if (notifications.length === 0) {
      try {
        const { MovementRequest } = require('../models');
        
        // 1. Backfill Movement Permits matching user's jurisdiction scope
        const movements = await MovementRequest.findAll({
          where: scopeFilter,
          order: [['createdAt', 'DESC']],
          limit: 30
        });

        for (const m of movements) {
          const notifMsg = `📋 MOVEMENT PERMIT ${m.permit_number || '#' + m.id}: ${m.animal_type} (${m.count} head) [${m.origin_district || m.origin_sector || 'Origin'} ➔ ${m.dest_district || m.dest_sector || 'Destination'}]. Status: ${m.status}`;
          const notifType = m.status === 'APPROVED' ? 'APPROVAL' : m.status === 'COMPLETED' ? 'ARRIVAL' : 'SYSTEM';
          await NotificationLog.create({
            user_id: req.user.id,
            message: notifMsg,
            type: notifType,
            createdAt: m.createdAt
          }).catch(() => {});
        }

        // 2. Backfill Cases if applicable
        if (req.user.role === 'POLICE' || req.user.role === 'RAB' || req.user.role === 'ADMIN') {
          const cases = await Case.findAll({ order: [['createdAt', 'DESC']], limit: 20 });
          for (const c of cases) {
            const plateStr = c.vehicle_plate ? ` for Vehicle ${c.vehicle_plate}` : '';
            const typeLabel = c.type ? c.type.replace(/_/g, ' ') : 'VEHICLE CLAIM';
            const notifMsg = `🚨 POLICE CASE FILED: Reported [${typeLabel}]${plateStr}. Details: ${c.details || 'No details'}`;
            await NotificationLog.create({
              user_id: req.user.id,
              message: notifMsg,
              type: 'ALERT',
              createdAt: c.createdAt
            }).catch(() => {});
          }
        }

        notifications = await NotificationLog.findAll({
          where: { user_id: req.user.id },
          order: [['createdAt', 'DESC']],
          limit: 50
        });
      } catch (err) {
        console.error('Failed to backfill notifications:', err.message);
      }
    }

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read (or mark all)
router.put('/:id/read', protect, async (req, res) => {
  try {
    if (req.params.id === 'all') {
      await NotificationLog.update(
        { read: true },
        { where: { user_id: req.user.id, read: false } }
      );
    } else {
      const notification = await NotificationLog.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });
      if (!notification) return res.status(404).json({ message: 'Notification not found' });
      
      notification.read = true;
      await notification.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
