const { sequelize, User, MovementRequest, MovementAnimal, Trip } = require('./models');
const movementService = require('./services/movementService');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Test for a dummy user or first user in DB
    const users = await User.findAll({ limit: 5 });
    console.log('Found users:', users.map(u => ({ id: u.id, role: u.role, district_id: u.district_id, sector_id: u.sector_id })));

    for (const u of users) {
      console.log(`Testing getRequests for user ${u.role} (${u.id})...`);
      const res = await movementService.getRequests(u);
      console.log(`Success for ${u.role}! Returned ${res.length} requests.`);
    }
  } catch (err) {
    console.error('QUERY FAILED:', err);
  } finally {
    process.exit(0);
  }
}

test();
