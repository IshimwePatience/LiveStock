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

module.exports = { createCase, getCases };
