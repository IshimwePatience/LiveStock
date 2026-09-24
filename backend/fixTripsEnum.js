const { sequelize } = require('./config/db');

async function fixTripsEnum() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected');
    
    // Add missing enum values if PostgreSQL ENUM exists
    const enumQueries = [
      "ALTER TYPE \"enum_Trips_status\" ADD VALUE IF NOT EXISTS 'SCHEDULED';",
      "ALTER TYPE \"enum_Trips_status\" ADD VALUE IF NOT EXISTS 'ACTIVE';",
      "ALTER TYPE \"enum_Trips_status\" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';",
      "ALTER TYPE \"enum_Trips_status\" ADD VALUE IF NOT EXISTS 'COMPLETED';",
      "ALTER TYPE \"enum_Trips_status\" ADD VALUE IF NOT EXISTS 'CANCELLED';"
    ];

    for (const q of enumQueries) {
      try {
        await sequelize.query(q);
        console.log('Executed:', q);
      } catch (err) {
        console.log('Enum query notice:', err.message);
      }
    }

    // Alter column status in Trips table to VARCHAR(255) so strings are accepted seamlessly
    try {
      await sequelize.query('ALTER TABLE "Trips" ALTER COLUMN status TYPE VARCHAR(255) USING status::VARCHAR;');
      console.log('Successfully converted Trips.status column to VARCHAR(255)');
    } catch (err) {
      console.log('Column alter notice:', err.message);
    }

    console.log('Fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

fixTripsEnum();
