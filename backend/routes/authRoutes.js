const express = require('express');
const router = express.Router();
const { loginUser, registerUser, forgotPassword, resetPassword, getAllUsers, updateUser, deleteUser, toggleUserStatus } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/login', loginUser);
router.post('/register', protect, authorize('RAB'), registerUser);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);
router.get('/users', protect, authorize('RAB'), getAllUsers);
router.put('/users/:id', protect, authorize('RAB'), updateUser);
router.delete('/users/:id', protect, authorize('RAB'), deleteUser);
router.patch('/users/:id/status', protect, authorize('RAB'), toggleUserStatus);

module.exports = router;
