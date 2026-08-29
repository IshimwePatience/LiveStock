const bcrypt = require('bcrypt');
const { User, sequelize } = require('../models');
const { connectDB } = require('../config/db');

const seedAdmin = async () => {
  try {
    await connectDB();
    await sequelize.sync({ force: false }); // Ensure DB tables exist

    const adminEmail = 'admin@rab.gov.rw';
    const adminExists = await User.findOne({ where: { email: adminEmail } });

    if (adminExists) {
      console.log('RAB Admin already exists!');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('RabAdmin123!', salt);

    await User.create({
      name: 'Super Admin (RAB)',
      email: adminEmail,
      password_hash,
      role: 'RAB',
    });

    console.log('RAB Admin seeded successfully! Email: admin@rab.gov.rw, Password: RabAdmin123!');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
