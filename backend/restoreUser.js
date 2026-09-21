const bcrypt = require('bcrypt');
const { User, MovementRequest, MovementAnimal, sequelize } = require('./models');

const restoreUser = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('12345678', salt);

    // Primary email for Gatsibo DARO officer
    const primaryEmail = '078303876@daro.gov.rw';
    const primaryPhone = '078303876';

    let primaryUser = await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { email: primaryEmail },
          { phone: primaryPhone },
          { email: 'dvogatsibo@gmal.com' },
          { email: 'daro.gatsibo@daro.gov.rw' }
        ]
      }
    });

    if (!primaryUser) {
      primaryUser = await User.create({
        name: 'HITIYAREMYE Valens',
        email: primaryEmail,
        phone: primaryPhone,
        password_hash,
        role: 'DARO',
        district_id: 'Gatsibo',
        status: 'Active',
        must_change_password: false,
        permissions: ['overview', 'gps', 'movements', 'geofencing', 'national_reports', 'notifications', 'user_management']
      });
      console.log(`✅ Created Gatsibo DARO user: HITIYAREMYE Valens (${primaryEmail})`);
    } else {
      await primaryUser.update({
        name: 'HITIYAREMYE Valens',
        status: 'Active',
        district_id: 'Gatsibo',
        role: 'DARO',
        permissions: ['overview', 'gps', 'movements', 'geofencing', 'national_reports', 'notifications', 'user_management']
      });
      console.log(`✅ Updated Gatsibo DARO user: HITIYAREMYE Valens (${primaryUser.email})`);
    }

    if (primaryUser) {
      // Clear non-matching old test permits for Gatsibo if any exist
      await MovementRequest.destroy({
        where: {
          permit_number: ['B26351397GATSIBO', 'B26956905GATSIBO']
        }
      });

      const validUntilDate = new Date('2026-09-07T23:59:59.000Z');

      // Tag lists from handwritten photos
      const tagsMovement1 = [
        '2098167', '23000693', '2961188', '2974966', '2822759', 
        '2960850', '2365919', '1214393', '2365785', '2128713', 
        '2961224', '2698088', '1989514', '2974988', '0244503', 
        '1147272', '0174851', '26917844', '2346169', '3181363', 
        '2975071', '2025197', '0890856', '0174139', '2960857'
      ];

      const tagsMovement2 = [
        '0871888', '1943908', '0683246', '1590029', '2200255', 
        '1299869', '1045877', '153036', '1319563', '2033286', 
        '1633285', '2218343', '2287762', '2368156', '2368200', 
        '2368125', '2368128', '1092201', '1055729', '2288080'
      ];

      const gatsiboMovements = [
        // 1. Gatsibo (Rwimbogo) -> Nyarugenge (Gitega)
        {
          permit_number: 'MVT-7B1A2C3D',
          type: 'DISTRICT_TO_DISTRICT',
          origin_id: 'Gatsibo',
          destination_id: 'Nyarugenge',
          animal_type: 'Inka (Cow)',
          count: tagsMovement1.length,
          reason: 'Kubaga (Slaughter)',
          owner_name: 'Gatsibo Farmer',
          owner_id_number: '1198580045812901',
          owner_phone: '078303876',
          buyer_name: 'AHISHAKIYE Jean Bosco',
          buyer_phone: '0788998877',
          priority: 'Normal',
          transport_type: 'Imodoka',
          plate_number: 'RAE 212V',
          origin_district: 'Gatsibo',
          origin_sector: 'Rwimbogo',
          origin_cell: 'Rwikiniro',
          origin_village: 'Rwikiniro I',
          dest_district: 'Nyarugenge',
          dest_sector: 'Gitega',
          dest_cell: 'Gitega',
          dest_village: 'Gitega',
          valid_until: validUntilDate,
          driver_name: 'Valens NIYOMUKIZA',
          driver_phone: '0788112233',
          driver_nid: '1199080034812304',
          cargo_photo: '/cargo_photos/cargo1.jpg',
          status: 'APPROVED',
          initiator_id: primaryUser.id,
          tags: tagsMovement1
        },
        // 2. Gatsibo (Rwimbogo) -> Gasabo (Rusororo)
        {
          permit_number: 'B26686363XFPV',
          type: 'DISTRICT_TO_DISTRICT',
          origin_id: 'Gatsibo',
          destination_id: 'Gasabo',
          animal_type: 'Inka (Cow)',
          count: tagsMovement2.length,
          reason: 'Kugurishwa (Trade)',
          owner_name: 'Gatsibo Farmer',
          owner_id_number: '1198880045812902',
          owner_phone: '078303876',
          priority: 'Normal',
          transport_type: 'Imodoka',
          plate_number: 'RAB 195F',
          origin_district: 'Gatsibo',
          origin_sector: 'Rwimbogo',
          origin_cell: 'Rwikiniro',
          origin_village: 'Rwikiniro I',
          dest_district: 'Gasabo',
          dest_sector: 'Rusororo',
          dest_cell: 'Rusororo',
          dest_village: 'Rusororo',
          valid_until: validUntilDate,
          driver_name: 'PATRICK V.',
          driver_phone: '0783202922',
          driver_nid: '1199280034812305',
          cargo_photo: '/cargo_photos/cargo2.jpg',
          status: 'APPROVED',
          initiator_id: primaryUser.id,
          tags: tagsMovement2
        },
        // 3. Gatsibo (Rwimbogo) -> Nyagatare (Rwemiyaga / Rwemasha)
        {
          permit_number: 'B26446429GATSIBO',
          type: 'DISTRICT_TO_DISTRICT',
          origin_id: 'Gatsibo',
          destination_id: 'Nyagatare',
          animal_type: 'Inka (Cow)',
          count: 20,
          reason: 'Korora (Breeding)',
          owner_name: 'Gatsibo Farmer',
          owner_id_number: '1198780045812903',
          owner_phone: '078303876',
          priority: 'Urgency',
          transport_type: 'Imodoka',
          plate_number: 'RAI 222R',
          origin_district: 'Gatsibo',
          origin_sector: 'Rwimbogo',
          origin_cell: 'Rwikiniro',
          origin_village: 'Rwikiniro I',
          dest_district: 'Nyagatare',
          dest_sector: 'Rwemiyaga',
          dest_cell: 'Rwemasha',
          dest_village: 'Rwemasha',
          valid_until: validUntilDate,
          driver_name: 'Ishimwe Joe',
          driver_phone: '0783202922',
          driver_nid: '1199380034812306',
          cargo_photo: '/cargo_photos/cargo3.jpg',
          status: 'APPROVED',
          initiator_id: primaryUser.id
        }
      ];

      for (const m of gatsiboMovements) {
        const { tags, ...reqData } = m;
        let [req, created] = await MovementRequest.findOne({ where: { permit_number: reqData.permit_number } })
          .then(async found => {
            if (found) {
              await found.update(reqData);
              return [found, false];
            }
            const createdObj = await MovementRequest.create(reqData);
            return [createdObj, true];
          });

        console.log(`✅ ${created ? 'Created' : 'Updated'} Permit #${reqData.permit_number}: ${reqData.origin_district} (${reqData.origin_sector}) ➔ ${reqData.dest_district} (${reqData.dest_sector}) - Valid Until: 07 Sep 2026`);

        // Insert / sync animal tags into MovementAnimal table
        if (tags && tags.length > 0) {
          await MovementAnimal.destroy({ where: { movement_request_id: req.id } });
          const animalsToInsert = tags.map(t => ({
            movement_request_id: req.id,
            tag_number: t,
            animal_type: 'COW',
            quantity: 1,
            sex: 'FEMALE',
            breed: 'ANCHOR/LOCAL',
            color: 'BLACK/WHITE'
          }));
          await MovementAnimal.bulkCreate(animalsToInsert);
          console.log(`   🏷️  Attached ${tags.length} handwritten cow ear-tags to Permit #${reqData.permit_number}`);
        }
      }
    }
  } catch (err) {
    console.error('Error restoring user & movements:', err);
  } finally {
    process.exit(0);
  }
};

restoreUser();
