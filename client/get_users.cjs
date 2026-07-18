const axios = require('axios');

const API_URL = 'https://hospital-management-system-pi-roan.vercel.app/api';

const run = async () => {
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@hms.com',
      password: 'adminpassword123',
    });
    const token = loginRes.data.accessToken;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const res = await axios.get(`${API_URL}/users`, config);
    const users = res.data.users;
    
    users.forEach(u => {
      console.log(`Role: ${u.role.padEnd(8)} | Name: ${u.name.padEnd(20)} | Email: ${u.email}`);
    });
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
  }
};

run();
