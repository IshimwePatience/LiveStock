const { sequelize } = require('../models');

async function replaceName() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // 1. Update Users table
    const [uRes] = await sequelize.query(`
      UPDATE "Users"
      SET "name" = 'Itangishatse Patrick'
      WHERE "name" ILIKE '%ishimwe patience%';
    `);
    console.log('Updated Users name.');

    // 2. Update MovementRequests table (owner_name and driver_name)
    await sequelize.query(`
      UPDATE "MovementRequests"
      SET "owner_name" = 'Itangishatse Patrick'
      WHERE "owner_name" ILIKE '%ishimwe patience%';
    `);
    await sequelize.query(`
      UPDATE "MovementRequests"
      SET "driver_name" = 'Itangishatse Patrick'
      WHERE "driver_name" ILIKE '%ishimwe patience%';
    `);
    console.log('Updated MovementRequests owner_name and driver_name.');

    // 3. Update MovementAnimals table (owner_name)
    await sequelize.query(`
      UPDATE "MovementAnimals"
      SET "owner_name" = 'Itangishatse Patrick'
      WHERE "owner_name" ILIKE '%ishimwe patience%';
    `);
    console.log('Updated MovementAnimals owner_name.');

    // 4. Update NotificationLogs table (message)
    await sequelize.query(`
      UPDATE "NotificationLogs"
      SET "message" = REGEXP_REPLACE("message", 'ishimwe patience', 'Itangishatse Patrick', 'gi');
    `);
    console.log('Updated NotificationLogs messages.');

    console.log('All occurrences of "Ishimwe Patience" have been successfully replaced with "Itangishatse Patrick".');
    process.exit(0);
  } catch (error) {
    console.error('Failed to replace names:', error);
    process.exit(1);
  }
}

replaceName();
