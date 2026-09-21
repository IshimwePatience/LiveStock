const { MovementRequest, User, sequelize } = require('./models');

const seed100Movements = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');

    // Find Gatsibo DARO officer HITIYAREMYE Valens
    let daroUser = await User.findOne({ where: { role: 'DARO', district_id: 'Gatsibo' } });
    if (!daroUser) {
      daroUser = await User.findOne({ where: { email: '0788303876@daro.gov.rw' } });
    }
    const initiatorId = daroUser ? daroUser.id : '6f95ce10-904f-4a64-a366-49227e971e94';

    const districts = [
      'Gatsibo', 'Nyagatare', 'Nyarugenge', 'Gasabo', 'Kicukiro', 
      'Bugesera', 'Rwamagana', 'Kayonza', 'Gicumbi', 'Burera', 'Musanze', 'Huye'
    ];

    const gatsiboSectors = [
      'Kabarore', 'Kiziguro', 'Rwimbogo', 'Ngarama', 'Nyagihanga', 
      'Gitoki', 'Kageyo', 'Muhura', 'Murambi', 'Rugarama', 'Gasange', 'Kiramuruzi', 'Remera'
    ];

    const animalTypes = ['Inka (Cow)', 'Ihene (Goat)', 'Intama (Sheep)', 'Ingurube (Pig)'];
    const reasons = ['Kubaga (Slaughter)', 'Kugurishwa (Trade)', 'Korora (Farming)', 'Expo / Livestock Fair'];
    const priorities = ['Normal', 'Urgency', 'High'];
    const statuses = ['APPROVED', 'APPROVED', 'APPROVED', 'PENDING', 'REJECTED', 'ACTIVE', 'COMPLETED'];

    const firstNames = ['Valens', 'Jean', 'Patrick', 'Claude', 'Innocent', 'Emmanuel', 'Moses', 'Eric', 'Bosco', 'Alexis'];
    const lastNames = ['NIYOMUKIZA', 'HABIMANA', 'MUGISHA', 'KWIZERA', 'NZAYISENGA', 'BIKORIMANA', 'KAREGEYA', 'NDIZIHIWE'];

    const requestsToCreate = [];

    for (let i = 1; i <= 105; i++) {
      const isOriginGatsibo = i % 2 === 0 || i % 3 === 0;
      const originDist = isOriginGatsibo ? 'Gatsibo' : districts[i % districts.length];
      let destDist = districts[(i * 3) % districts.length];
      if (destDist === originDist) destDist = 'Nyarugenge';

      const originSec = gatsiboSectors[i % gatsiboSectors.length];
      const destSec = 'Kigali';

      const permitNum = `MVT-${2026}${String(i).padStart(4, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const count = Math.floor(Math.random() * 25) + 5;
      const animal = animalTypes[i % animalTypes.length];
      const status = statuses[i % statuses.length];

      const driverName = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
      const driverPhone = `078${Math.floor(1000000 + Math.random() * 9000000)}`;
      const ownerName = isOriginGatsibo ? 'HITIYAREMYE Valens' : `${firstNames[(i + 2) % firstNames.length]} ${lastNames[(i + 1) % lastNames.length]}`;

      // Date spread out over last 60 days
      const daysAgo = Math.floor(Math.random() * 60);
      const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      requestsToCreate.push({
        type: 'DISTRICT_TO_DISTRICT',
        initiator_id: initiatorId,
        origin_id: originDist,
        destination_id: destDist,
        animal_type: animal,
        count: count,
        reason: reasons[i % reasons.length],
        status: status,
        owner_name: ownerName,
        owner_id_number: `119${1000000000000 + i}`,
        owner_phone: driverPhone,
        priority: priorities[i % priorities.length],
        transport_type: 'Imodoka',
        plate_number: `RAE ${100 + i}V`,
        origin_district: originDist,
        origin_sector: originSec,
        origin_cell: originSec,
        origin_village: originSec,
        dest_district: destDist,
        dest_sector: destSec,
        dest_cell: destSec,
        dest_village: destSec,
        permit_number: permitNum,
        valid_until: new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        driver_name: driverName,
        driver_phone: driverPhone,
        driver_nid: `1199${1000000000000 + i}`,
        createdAt: createdDate,
        updatedAt: createdDate
      });
    }

    let seededCount = 0;
    for (const req of requestsToCreate) {
      const [record, created] = await MovementRequest.findOrCreate({
        where: { permit_number: req.permit_number },
        defaults: req
      });
      if (created) seededCount++;
    }

    const totalNow = await MovementRequest.count();
    console.log(`==================================================`);
    console.log(`✅ Successfully seeded 100+ Movement Requests for HITIYAREMYE Valens (Gatsibo DARO)!`);
    console.log(`   - New records created: ${seededCount}`);
    console.log(`   - Total Movement Requests in Database now: ${totalNow}`);
    console.log(`==================================================`);
  } catch (err) {
    console.error('Error seeding 100+ movement requests:', err);
  } finally {
    process.exit(0);
  }
};

seed100Movements();
