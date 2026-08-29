const { sequelize } = require('./config/db');

async function addStatusColumn() {
  try {
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "status" VARCHAR(255) DEFAULT \'Active\';');
    console.log("Status column added successfully");
  } catch (err) {
    console.error("Error adding status column:", err.message);
  } finally {
    process.exit(0);
  }
}

addStatusColumn();
