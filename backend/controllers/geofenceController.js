const geofenceService = require('../services/geofenceService');

exports.getGeofences = async (req, res) => {
  try {
    const fences = await geofenceService.getAllGeofences();
    res.json(fences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createGeofence = async (req, res) => {
  try {
    const fence = await geofenceService.createGeofence({
      ...req.body,
      created_by: req.user ? req.user.id : null
    });
    res.status(201).json(fence);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteGeofence = async (req, res) => {
  try {
    await geofenceService.deleteGeofence(req.params.id);
    res.json({ message: 'Geofence zone deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.toggleGeofence = async (req, res) => {
  try {
    const fence = await geofenceService.toggleGeofence(req.params.id);
    res.json(fence);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.checkLocation = async (req, res) => {
  try {
    const { plate, lat, lon } = req.body;
    const result = await geofenceService.checkVehicleViolation(plate, lat, lon);
    res.json(result || { violation: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
