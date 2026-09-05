const axios = require('axios');

async function checkData() {
  const client = axios.create({
    baseURL: 'https://ekazeapi.benomobility.rw',
    auth: {
      username: 'ishimwepatience102@gmail.com',
      password: 'z3fOM2SjKfe%5,2<4'
    }
  });

  const dev = await client.get('/api/devices');
  const pos = await client.get('/api/positions');

  console.log('--- DEVICES SAMPLE ---');
  console.log(dev.data.slice(0, 3));

  console.log('\n--- POSITIONS SAMPLE ---');
  console.log(pos.data.slice(0, 3));
}

checkData();
