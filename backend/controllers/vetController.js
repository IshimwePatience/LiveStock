const vetService = require('../services/vetService');

const addRecord = async (req, res) => {
  try {
    const record = await vetService.addRecord(req.user, req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getRecords = async (req, res) => {
  try {
    const records = await vetService.getRecords(req.user);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkTag = async (req, res) => {
  try {
    const result = await vetService.checkTag(req.params.tag);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addRecord, getRecords, checkTag };
