const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { User } = require('../models');

const DEFAULT_ROLE_PERMISSIONS = {
  RAB: ['overview', 'cases', 'gps', 'movements', 'geofencing', 'national_reports', 'performance_audit', 'notifications', 'system_settings', 'user_management'],
  DARO: ['overview', 'gps', 'movements', 'geofencing', 'notifications', 'user_management'],
  SARO: ['overview', 'gps', 'movements', 'geofencing', 'notifications'],
  POLICE: ['cases', 'gps', 'notifications']
};

const resolveUserPermissions = (user) => {
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }
  return DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.SARO;
};

class AuthService {
  generateToken(id) {
    const secret = process.env.JWT_SECRET || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
    return jwt.sign({ id }, secret, { expiresIn: '30d' });
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      const permissions = resolveUserPermissions(user);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        district_id: user.district_id,
        sector_id: user.sector_id,
        permissions,
        token: this.generateToken(user.id),
      };
    }
    throw new Error('Invalid email or password');
  }

  async register(data) {
    const { name, email, password, role, district_id, sector_id, permissions } = data;
    const userExists = await User.findOne({ where: { email } });

    if (userExists) throw new Error('User already exists');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const initialPermissions = permissions && Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.SARO;

    const user = await User.create({
      name, email, password_hash, role,
      district_id: district_id || null,
      sector_id: sector_id || null,
      permissions: initialPermissions,
    });
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      district_id: user.district_id,
      sector_id: user.sector_id,
      permissions: user.permissions,
    };
  }

  async getAllUsers(currentUser) {
    let whereClause = {};

    if (currentUser && currentUser.role === 'DARO') {
      whereClause = {
        role: 'SARO',
        district_id: currentUser.district_id
      };
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] },
      order: [['createdAt', 'DESC']]
    });

    return users.map(user => {
      const userJson = user.toJSON();
      userJson.permissions = resolveUserPermissions(user);
      return userJson;
    });
  }

  async updateUser(id, data, currentUserId) {
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');
    
    const updateData = { ...data };
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
    }

    await user.update(updateData);
    const permissions = resolveUserPermissions(user);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      district_id: user.district_id,
      sector_id: user.sector_id,
      permissions,
    };
  }

  async deleteUser(id, currentUserId) {
    if (id === currentUserId) throw new Error('You cannot delete your own account');
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');
    await user.destroy();
    return { message: 'User deleted successfully' };
  }

  async toggleUserStatus(id, currentUserId) {
    if (id === currentUserId) throw new Error('You cannot deactivate your own account');
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');
    
    user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    await user.save();
    return { id: user.id, status: user.status, message: `User marked as ${user.status}` };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('User not found');

    // Generate a 6-digit OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.reset_token = crypto.createHash('sha256').update(resetOtp).digest('hex');
    user.reset_token_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    console.log(`\n=========================================\nPASSWORD RESET OTP FOR ${email}: ${resetOtp}\n=========================================\n`);

    try {
      // Send email via Nodemailer
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'Password Reset OTP',
        text: `You requested a password reset. Your 6-digit OTP is: ${resetOtp}. It expires in 10 minutes.`,
      });
    } catch (err) {
      console.log('Failed to send email. Check SMTP settings.');
    }

    return { message: 'OTP sent' };
  }

  async resetPassword(email, otp, newPassword) {
    if (!email || !otp || !newPassword) throw new Error('Email, OTP, and new password are required');

    const hashedToken = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    const user = await User.findOne({
      where: {
        email: email,
        reset_token: hashedToken,
        reset_token_expires: { [require('sequelize').Op.gt]: Date.now() }
      }
    });

    if (!user) throw new Error('Invalid or expired OTP');

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();

    return { message: 'Password updated successfully' };
  }
}

module.exports = new AuthService();
