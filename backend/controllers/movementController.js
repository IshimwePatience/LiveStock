const movementService = require('../services/movementService');

const createRequest = async (req, res) => {
  try {
    const request = await movementService.createRequest(req.user, req.body);
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const request = await movementService.updateRequest(req.user, req.params.id, req.body);
    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getRequests = async (req, res) => {
  try {
    const requests = await movementService.getRequests(req.user);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const request = await movementService.getRequestById(req.user, req.params.id);
    res.json(request);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const approveRequest = async (req, res) => {
  try {
    const result = await movementService.approveRequest(req.user, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const result = await movementService.rejectRequest(req.user, req.params.id, req.body.reason);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createRequest, updateRequest, getRequests, getRequestById, approveRequest, rejectRequest };
