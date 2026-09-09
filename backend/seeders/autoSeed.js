const bcrypt = require('bcrypt');
const { User } = require('../models');
const seedSAROs = require('./seedSAROs');

const autoSeed = async () => {
  try {
    const adminEmail = 'admin@rab.gov.rw';
    const adminExists = await User.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('RabAdmin123!', salt);

      await User.create({
        name: 'Super Admin (RAB)',
        email: adminEmail,
        password_hash,
        role: 'RAB',
      });
      console.log('⚡ RAB Super Admin seeded automatically: admin@rab.gov.rw / RabAdmin123!');
    }

    // Auto-seed SARO & DARO accounts
    await seedSAROs();
  } catch (error) {
    console.error('Error auto-seeding admin & SAROs:', error.message);
  }
};

module.exports = autoSeed;
