const express = require('express');
const router = express.Router();
const {
  loginUser, registerUser, getMe, forgotPassword, resetPassword, getAllUsers, updateUser, deleteUser, toggleUserStatus,
  changePassword, toggleMfa, toggleLocationTracking, getUserLocationStatuses, updateRolePermissions, updateProfilePicture
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/register', protect, authorize('RAB'), registerUser);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);
router.get('/users', protect, authorize('RAB', 'DARO'), getAllUsers);
router.put('/users/:id', protect, authorize('RAB'), updateUser);
router.put('/roles/:role/permissions', protect, authorize('RAB'), updateRolePermissions);
router.delete('/users/:id', protect, authorize('RAB'), deleteUser);
router.patch('/users/:id/status', protect, authorize('RAB'), toggleUserStatus);

// Personal settings & security routes
router.post('/change-password', protect, changePassword);
router.post('/mfa/toggle', protect, authorize('RAB'), toggleMfa);
router.put('/location-toggle', protect, toggleLocationTracking);
router.get('/users/location-status', protect, authorize('RAB'), getUserLocationStatuses);
router.put('/profile-picture', protect, updateProfilePicture);

module.exports = router;
