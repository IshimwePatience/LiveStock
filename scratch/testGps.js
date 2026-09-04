const axios = require('axios');

async function testGps() {
  console.log('--- Testing without auth ---');
  try {
    const pos = await axios.get('https://ekazeapi.benomobility.rw/api/positions');
    console.log('POSITIONS SUCCESS:', pos.data);
  } catch (e) {
    console.log('POSITIONS FAILED:', e.message);
  }

  try {
    const dev = await axios.get('https://ekazeapi.benomobility.rw/api/devices');
    console.log('DEVICES SUCCESS:', dev.data);
  } catch (e) {
    console.log('DEVICES FAILED:', e.message, e.response?.status);
  }

  console.log('\n--- Testing with auth ---');
  try {
    const client = axios.create({
      baseURL: 'https://ekazeapi.benomobility.rw',
      auth: {
        username: 'ishimwepatience102@gmail.com',
        password: 'z3fOM2SjKfe%5,2<4'
      }
    });
    const pos = await client.get('/api/positions');
    console.log('AUTH POSITIONS SUCCESS:', pos.data.length);
    const dev = await client.get('/api/devices');
    console.log('AUTH DEVICES SUCCESS:', dev.data.length);
  } catch (e) {
    console.log('AUTH FAILED:', e.message, e.response?.status);
  }
}

testGps();
