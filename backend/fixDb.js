const { sequelize } = require('./models');

async function fix() {
  try {
    await sequelize.query('ALTER TABLE "Users" DROP COLUMN district_id, DROP COLUMN sector_id;');
    console.log('Dropped User columns');
  } catch (e) { console.error('User drop error', e.message); }
  
  try {
    await sequelize.query('ALTER TABLE "MovementRequests" DROP COLUMN origin_id, DROP COLUMN destination_id;');
    console.log('Dropped Movement columns');
  } catch (e) { console.error('Movement drop error', e.message); }

  await sequelize.sync({ alter: true });
  console.log('Synced!');
  process.exit(0);
}

fix();
