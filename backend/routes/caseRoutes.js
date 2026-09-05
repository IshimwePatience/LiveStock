const express = require('express');
const router = express.Router();
const { createCase, getCases, updateStatus } = require('../controllers/caseController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('POLICE', 'SARO', 'DARO', 'RAB'), createCase)
  .get(protect, getCases);

router.put('/:id/status', protect, updateStatus);

module.exports = router;
