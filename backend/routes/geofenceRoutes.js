const express = require('express');
const router = express.Router();
const geofenceController = require('../controllers/geofenceController');
const { protect } = require('../middleware/auth');

router.get('/', protect, geofenceController.getGeofences);
router.post('/', protect, geofenceController.createGeofence);
router.delete('/:id', protect, geofenceController.deleteGeofence);
router.patch('/:id/toggle', protect, geofenceController.toggleGeofence);
router.post('/check-location', protect, geofenceController.checkLocation);

module.exports = router;
