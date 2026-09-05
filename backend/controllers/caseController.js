const caseService = require('../services/caseService');

const createCase = async (req, res) => {
  try {
    const newCase = await caseService.createCase(req.user, req.body);
    res.status(201).json(newCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getCases = async (req, res) => {
  try {
    const cases = await caseService.getCases(req.user);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await caseService.updateCaseStatus(req.user, id, status);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createCase, getCases, updateStatus };
