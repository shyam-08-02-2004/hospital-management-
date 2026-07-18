const axios = require('axios');

const API_URL = 'https://hospital-management-system-pi-roan.vercel.app/api';

const run = async () => {
  try {
    console.log('Logging in as Admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@hms.com',
      password: 'adminpassword123',
    });
    const token = loginRes.data.accessToken;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('Admin login successful!');

    console.log('Cleaning up patients...');
    const res = await axios.delete(`${API_URL}/patients/cleanup`, config);
    console.log(res.data.message);

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
  }
};

run();
