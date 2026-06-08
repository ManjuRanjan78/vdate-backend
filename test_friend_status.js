const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/friends/status/1/2');
    console.log(res.data);
  } catch (err) {
    console.error(err.message);
  }
}
test();