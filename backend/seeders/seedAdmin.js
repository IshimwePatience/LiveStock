const bcrypt = require('bcrypt');
const { User, sequelize } = require('../models');
const { connectDB } = require('../config/db');

const seedAdmin = async () => {
  try {
    await connectDB();
    await sequelize.sync({ force: false }); // Ensure DB tables exist

    const adminEmail = 'admin@lab.gov.rw';
    const adminExists = await User.findOne({ where: { email: adminEmail } });

    if (adminExists) {
      console.log('LAB Admin already exists!');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('LabAdmin123!', salt);

    await User.create({
      name: 'Super Admin (LAB)',
      email: adminEmail,
      password_hash,
      role: 'LAB',
    });

    console.log('LAB Admin seeded successfully! Email: admin@lab.gov.rw, Password: LabAdmin123!');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
