const path = require('path');
const fs = require('fs');
const { User, MovementRequest, MovementAnimal, VetRecord, Trip, Case, NotificationLog, sequelize } = require('../models');

async function importData() {
  const seedFile = path.join(__dirname, '../seedData.json');
  if (!fs.existsSync(seedFile)) {
    console.error('seedData.json file not found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(seedFile, 'utf8'));

  await sequelize.authenticate();
  console.log('Connected to target PostgreSQL database.');

  // Disable foreign key checks during import
  await sequelize.query("SET session_replication_role = 'replica';");

  try {
    if (data.User && data.User.length > 0) {
      await User.bulkCreate(data.User, { ignoreDuplicates: true });
      console.log(`Imported ${data.User.length} Users.`);
    }

    if (data.MovementRequest && data.MovementRequest.length > 0) {
      await MovementRequest.bulkCreate(data.MovementRequest, { ignoreDuplicates: true });
      console.log(`Imported ${data.MovementRequest.length} MovementRequests.`);
    }

    if (data.MovementAnimal && data.MovementAnimal.length > 0) {
      await MovementAnimal.bulkCreate(data.MovementAnimal, { ignoreDuplicates: true });
      console.log(`Imported ${data.MovementAnimal.length} MovementAnimals.`);
    }

    if (data.Trip && data.Trip.length > 0) {
      await Trip.bulkCreate(data.Trip, { ignoreDuplicates: true });
      console.log(`Imported ${data.Trip.length} Trips.`);
    }

    if (data.VetRecord && data.VetRecord.length > 0) {
      await VetRecord.bulkCreate(data.VetRecord, { ignoreDuplicates: true });
      console.log(`Imported ${data.VetRecord.length} VetRecords.`);
    }

    if (data.Case && data.Case.length > 0) {
      await Case.bulkCreate(data.Case, { ignoreDuplicates: true });
      console.log(`Imported ${data.Case.length} Cases.`);
    }

    if (data.NotificationLog && data.NotificationLog.length > 0) {
      await NotificationLog.bulkCreate(data.NotificationLog, { ignoreDuplicates: true });
      console.log(`Imported ${data.NotificationLog.length} NotificationLogs.`);
    }

    console.log('All local data imported successfully into production DB!');
  } finally {
    await sequelize.query("SET session_replication_role = 'origin';");
  }
  process.exit(0);
}

importData().catch(err => {
  console.error('Import error:', err);
  process.exit(1);
});
