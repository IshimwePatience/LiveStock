const express = require('express');
const router = express.Router();
const { createCase, getCases } = require('../controllers/caseController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('POLICE', 'SARO', 'DARO', 'LAB'), createCase)
  .get(protect, getCases);

module.exports = router;
