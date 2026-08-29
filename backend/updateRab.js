const { User, sequelize } = require('./models/index.js');
const { connectDB } = require('./config/db.js');

async function updateDb() {
  await connectDB();
  try {
    await sequelize.query("ALTER TYPE \"enum_Users_role\" ADD VALUE 'RAB'");
    console.log("Added RAB to enum_Users_role");
  } catch (e) {
    console.log("Enum might already have RAB or error: ", e.message);
  }
  await User.update(
    { role: 'RAB', name: 'Super Admin (RAB)', email: 'admin@rab.gov.rw' },
    { where: { role: 'LAB' } }
  );
  console.log("DB updated");
  process.exit(0);
}
updateDb();
