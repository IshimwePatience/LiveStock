const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { NotificationLog, Case } = require('../models');

// Get all notifications for the user
router.get('/', protect, async (req, res) => {
  try {
    let notifications = await NotificationLog.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50 // Limit to last 50 for performance
    });

    // Auto-populate past notifications for Police / RAB / Admin / Officers if no notification logs exist yet
    if (notifications.length === 0) {
      try {
        const { MovementRequest } = require('../models');
        
        // 1. Backfill Movement Permits
        const movements = await MovementRequest.findAll({ order: [['createdAt', 'DESC']], limit: 30 });
        for (const m of movements) {
          const typeLabel = m.type === 'DISTRICT_TO_DISTRICT' ? 'District-to-District' : 'Sector-to-Sector';
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
