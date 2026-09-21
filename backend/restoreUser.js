const bcrypt = require('bcrypt');
const { User, sequelize } = require('./models');

const restoreUser = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('12345678', salt);

    const emails = ['dvogatsibo@gmal.com', 'dvogatsibo@gmail.com', 'daro.gatsibo@daro.gov.rw'];

    for (const email of emails) {
      let existingUser = await User.findOne({ where: { email } });
      if (!existingUser) {
        existingUser = await User.create({
          name: 'DARO Officer - Gatsibo',
          email: email,
          phone: email === 'dvogatsibo@gmal.com' ? '0788300001' : (email === 'dvogatsibo@gmail.com' ? '0788300002' : '0788300003'),
          password_hash,
          role: 'DARO',
          district_id: 'Gatsibo',
          status: 'Active',
          must_change_password: false,
          permissions: ['overview', 'gps', 'movements', 'geofencing', 'national_reports', 'notifications', 'user_management']
        });
        console.log(`✅ Restored user: ${email} (ID: ${existingUser.id})`);
      } else {
        await existingUser.update({
          status: 'Active',
          district_id: 'Gatsibo',
          role: 'DARO',
          permissions: ['overview', 'gps', 'movements', 'geofencing', 'national_reports', 'notifications', 'user_management']
        });
        console.log(`✅ Updated & reactivated existing user: ${email} (ID: ${existingUser.id})`);
      }
    }
  } catch (err) {
    console.error('Error restoring user:', err);
  } finally {
    process.exit(0);
  }
};

restoreUser();
