const express = require('express');
const router = express.Router();
const { addRecord, getRecords, checkTag } = require('../controllers/vetController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('SARO'), addRecord)
  .get(protect, getRecords);

router.post('/bulk', protect, authorize('SARO'), addRecord);
router.get('/check-tag/:tag', protect, checkTag);

module.exports = router;
