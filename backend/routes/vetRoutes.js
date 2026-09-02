const express = require('express');
const router = express.Router();
const { addRecord, getRecords } = require('../controllers/vetController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('SARO'), addRecord)
  .get(protect, getRecords);

router.post('/bulk', protect, authorize('SARO'), addRecord);

module.exports = router;
