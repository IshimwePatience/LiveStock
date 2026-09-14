const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Feedback, NotificationLog } = require('../models');

// Submit Feedback or Help Request
router.post('/', protect, async (req, res) => {
  try {
    const { description, screenshot_url } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }

    const feedback = await Feedback.create({
      user_id: req.user.id,
      user_name: req.user.name || 'Anonymous User',
      user_email: req.user.email || req.user.phone || '',
      user_role: req.user.role || 'USER',
      description: description.trim(),
      screenshot_url: screenshot_url || null,
      status: 'OPEN'
    });

    res.status(201).json(feedback);
  } catch (err) {
    console.error('Error creating feedback:', err);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// Get Feedback items (Admin sees all, regular user sees their own)
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const isAdmin = req.user.role === 'RAB' || req.user.role === 'SuperAdmin';

    let whereClause = {};
    if (!isAdmin) {
      whereClause.user_id = req.user.id;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const items = await Feedback.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json(items);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
});

// Get count of open feedback items for Admin alert dot
router.get('/open-count', protect, async (req, res) => {
  try {
    const count = await Feedback.count({
      where: { status: 'OPEN' }
    });
    res.json({ count });
  } catch (err) {
    console.error('Error fetching open feedback count:', err);
    res.status(500).json({ message: 'Failed to fetch open feedback count' });
  }
});

// Mark feedback as RESOLVED (Admin only)
router.patch('/:id/resolve', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'RAB' || req.user.role === 'SuperAdmin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback report not found' });
    }

    feedback.status = 'RESOLVED';
    feedback.resolved_at = new Date();
    feedback.resolved_by = req.user.id;
    await feedback.save();

    // Create Notification strictly for the user who submitted the report
    if (feedback.user_id) {
      const descSnippet = feedback.description.length > 50 
        ? feedback.description.substring(0, 48) + '...'
        : feedback.description;

      await NotificationLog.create({
        user_id: feedback.user_id,
        message: `✅ Your feedback/issue report ("${descSnippet}") has been marked as resolved by System Admin.`,
        type: 'FEEDBACK_RESOLVED',
        read: false
      });
    }

    res.json(feedback);
  } catch (err) {
    console.error('Error resolving feedback:', err);
    res.status(500).json({ message: 'Failed to resolve feedback' });
  }
});

module.exports = router;
