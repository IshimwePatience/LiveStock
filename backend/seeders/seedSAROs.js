const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { User, sequelize } = require('../models');

const seedSAROs = async () => {
  try {
    let jsonPath = path.join(__dirname, 'saros_data.json');
    if (!fs.existsSync(jsonPath)) {
      jsonPath = path.join(__dirname, '../../scratch/parsed_saros.json');
    }
    
    if (!fs.existsSync(jsonPath)) {
      console.error('Parsed SAROs JSON file not found at:', jsonPath);
      return;
    }

    // Ensure phone column exists in Users table
    try {
      await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(255);');
    } catch (e) {
      console.log('Phone column check:', e.message);
    }

    const sarosData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Loaded ${sarosData.length} SARO entries from dataset.`);

    const salt = await bcrypt.genSalt(10);
    const defaultSaroPasswordHash = await bcrypt.hash('Saro@123', salt);

    // Seed 416 SARO accounts strictly using exact phone numbers from PDF dataset
    let seededSaroCount = 0;
    let existingSaroCount = 0;

    for (const item of sarosData) {
      const { sn, province, district, sector, name, phone } = item;
      if (!phone) continue;

      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) continue;

      const officerName = (!name || name.toLowerCase() === 'ntawuhari' || name.toLowerCase().includes('no saro'))
        ? `SARO Officer - ${sector}`
        : name;
      const email = `${cleanPhone}@saro.gov.rw`;

      const userExists = await User.findOne({
        where: {
          [sequelize.Sequelize.Op.or]: [
            { email },
            { phone: cleanPhone }
          ]
        }
      });

      if (!userExists) {
        await User.create({
          name: officerName,
          email,
          phone: cleanPhone,
          password_hash: defaultSaroPasswordHash,
          role: 'SARO',
          district_id: district,
          sector_id: sector,
          status: 'Active'
        });
        seededSaroCount++;
      } else {
        existingSaroCount++;
      }
    }

    console.log(`==================================================`);
    console.log(`✅ SARO Account Seeding Complete!`);
    console.log(`   - New SAROs created: ${seededSaroCount}`);
    console.log(`   - Existing SAROs found: ${existingSaroCount}`);
    console.log(`   - Total valid SAROs in DB: ${seededSaroCount + existingSaroCount}`);
    console.log(`   - Default Password: Saro@123`);
    console.log(`==================================================`);
  } catch (error) {
    console.error('Error seeding SARO accounts:', error.message);
  }
};

if (require.main === module) {
  sequelize.authenticate().then(() => {
    seedSAROs().then(() => process.exit(0));
  });
}

module.exports = seedSAROs;
