const { sequelize } = require('./config/db'); 
sequelize.query('ALTER TABLE "VetRecords" ALTER COLUMN trip_id DROP NOT NULL')
  .then(() => { console.log('Dropped NOT NULL constraint'); process.exit(0); })
  .catch(console.error);
