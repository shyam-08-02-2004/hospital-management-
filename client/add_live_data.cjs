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

    const deptsToAdd = [
      { name: 'Orthopedics', description: 'Bone and joint care', icon: 'ActivityIcon' },
      { name: 'Pediatrics', description: 'Infant and child care', icon: 'BabyIcon' },
      { name: 'Dermatology', description: 'Skin, hair, and nail care', icon: 'DropletIcon' },
      { name: 'Ophthalmology', description: 'Eye and vision care', icon: 'EyeIcon' },
    ];

    const departmentsMap = {};

    for (const dept of deptsToAdd) {
      try {
        const res = await axios.post(`${API_URL}/departments`, dept, config);
        console.log(`Created Department: ${dept.name}`);
        departmentsMap[dept.name] = res.data.department._id;
      } catch (err) {
        console.log(`Failed to create Dept ${dept.name}:`, err.response?.data?.message || err.message);
      }
    }

    const docsToAdd = [
      {
        name: 'Dr. Rahul Verma', email: 'rahul.ortho@hms.com', password: 'password123',
        phone: '+919876543201', departmentName: 'Orthopedics', specialization: 'Orthopedic Surgeon',
        qualifications: ['MBBS', 'MD Ortho'], experienceYears: 15, licenseNumber: 'LIC-ORTHO-1',
        consultationFee: 1200, bio: 'Senior Orthopedic Surgeon specializing in joint replacement.',
        availability: [
          { day: 'monday', startTime: '10:00', endTime: '14:00', slotDurationMinutes: 30 },
          { day: 'wednesday', startTime: '10:00', endTime: '14:00', slotDurationMinutes: 30 }
        ]
      },
      {
        name: 'Dr. Sneha Joshi', email: 'sneha.ortho@hms.com', password: 'password123',
        phone: '+919876543202', departmentName: 'Orthopedics', specialization: 'Sports Medicine',
        qualifications: ['MBBS', 'MS Ortho'], experienceYears: 8, licenseNumber: 'LIC-ORTHO-2',
        consultationFee: 800, bio: 'Expert in sports injuries and arthroscopy.',
        availability: [
          { day: 'tuesday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
          { day: 'thursday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 }
        ]
      },
      {
        name: 'Dr. Amit Patel', email: 'amit.pedia@hms.com', password: 'password123',
        phone: '+919876543203', departmentName: 'Pediatrics', specialization: 'Pediatrician',
        qualifications: ['MBBS', 'MD Pediatrics'], experienceYears: 12, licenseNumber: 'LIC-PEDIA-1',
        consultationFee: 900, bio: 'Passionate about child health and immunization.',
        availability: [
          { day: 'monday', startTime: '09:00', endTime: '12:00', slotDurationMinutes: 20 },
          { day: 'friday', startTime: '14:00', endTime: '18:00', slotDurationMinutes: 20 }
        ]
      },
      {
        name: 'Dr. Priya Singh', email: 'priya.derma@hms.com', password: 'password123',
        phone: '+919876543204', departmentName: 'Dermatology', specialization: 'Dermatologist',
        qualifications: ['MBBS', 'DDVL'], experienceYears: 10, licenseNumber: 'LIC-DERMA-1',
        consultationFee: 1000, bio: 'Specialist in clinical dermatology and aesthetics.',
        availability: [
          { day: 'wednesday', startTime: '10:00', endTime: '15:00', slotDurationMinutes: 30 },
          { day: 'saturday', startTime: '10:00', endTime: '15:00', slotDurationMinutes: 30 }
        ]
      },
      {
        name: 'Dr. Vikram Rao', email: 'vikram.eye@hms.com', password: 'password123',
        phone: '+919876543205', departmentName: 'Ophthalmology', specialization: 'Ophthalmologist',
        qualifications: ['MBBS', 'MS Opthalmology'], experienceYears: 20, licenseNumber: 'LIC-EYE-1',
        consultationFee: 1500, bio: 'Expert eye surgeon for cataract and LASIK.',
        availability: [
          { day: 'tuesday', startTime: '10:00', endTime: '16:00', slotDurationMinutes: 30 },
          { day: 'thursday', startTime: '10:00', endTime: '16:00', slotDurationMinutes: 30 }
        ]
      }
    ];

    for (const doc of docsToAdd) {
      const deptId = departmentsMap[doc.departmentName];
      if (!deptId) {
        console.log(`Skipping doctor ${doc.name}, department ${doc.departmentName} not found.`);
        continue;
      }

      const payload = { ...doc, department: deptId };
      delete payload.departmentName;

      try {
        await axios.post(`${API_URL}/doctors`, payload, config);
        console.log(`Created Doctor: ${doc.name}`);
      } catch (err) {
        console.log(`Failed to create Doctor ${doc.name}:`, err.response?.data?.message || err.message);
      }
    }

    console.log('All done!');
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
  }
};

run();
