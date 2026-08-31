const { sequelize } = require('./models');

async function fix() {
  try {
    await sequelize.query(`UPDATE "Users" SET name = 'Super Admin' WHERE name LIKE 'Super Admin %'`);
    console.log('Updated');
  } catch (e) { console.error(e.message); }
  process.exit(0);
}

fix();
