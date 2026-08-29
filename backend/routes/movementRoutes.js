const express = require('express');
const router = express.Router();
const { createRequest, getRequests, approveRequest } = require('../controllers/movementController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('SARO', 'DARO'), createRequest)
  .get(protect, getRequests);

router.route('/:id/approve')
  .put(protect, authorize('DARO', 'LAB'), approveRequest);

module.exports = router;
