const express = require('express');
const router = express.Router();
const { addRecord, getRecords } = require('../controllers/vetController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('SARO'), addRecord)
  .get(protect, getRecords);

module.exports = router;
