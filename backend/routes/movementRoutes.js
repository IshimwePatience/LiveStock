const express = require('express');
const router = express.Router();
const { createRequest, updateRequest, getRequests, getRequestById, approveRequest, rejectRequest } = require('../controllers/movementController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('SARO', 'DARO'), createRequest)
  .get(protect, getRequests);

router.route('/:id')
  .get(protect, getRequestById)
  .put(protect, authorize('SARO', 'DARO'), updateRequest);

router.route('/:id/approve')
  .put(protect, authorize('DARO', 'RAB'), approveRequest);

router.route('/:id/reject')
  .put(protect, authorize('DARO', 'RAB'), rejectRequest);

module.exports = router;
