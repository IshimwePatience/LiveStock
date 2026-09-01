const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { NotificationLog } = require('../models');

// Get all notifications for the user
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await NotificationLog.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50 // Limit to last 50 for performance
    });
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
