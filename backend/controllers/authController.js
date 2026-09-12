const authService = require('../services/authService');

const loginUser = async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.phone || req.body.email;
    const data = await authService.login(identifier, req.body.password);
    res.json(data);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const registerUser = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body.email, req.body.otp, req.body.password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers(req.user);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await authService.updateUser(req.params.id, req.body, req.user.id);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const result = await authService.deleteUser(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const result = await authService.toggleUserStatus(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const toggleMfa = async (req, res) => {
  try {
    const result = await authService.toggleMfa(req.user.id, req.body.enabled);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const toggleLocationTracking = async (req, res) => {
  try {
    const result = await authService.toggleLocationTracking(req.user.id, req.body.enabled);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getUserLocationStatuses = async (req, res) => {
  try {
    const users = await authService.getUserLocationStatuses(req.user);
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateRolePermissions = async (req, res) => {
  try {
    const result = await authService.updateRolePermissions(req.params.role, req.body.permissions);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changePassword,
  toggleMfa,
  toggleLocationTracking,
  getUserLocationStatuses,
  updateRolePermissions
};
