const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.production.local
dotenv.config({ path: path.join(__dirname, '../.env.production.local') });

const { User, Doctor, Department } = require('./models');
const { ROLES } = require('./utils/constants');

const ensureDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  await mongoose.connect(uri);
  console.log('Connected to DB');
};

const runSeed = async () => {
  try {
    await ensureDB();

    // 1. Add new departments
    console.log('Creating departments...');
    const newDepts = await Department.insertMany([
      { name: 'Orthopedics', description: 'Bone and joint care', icon: 'ActivityIcon' },
      { name: 'Pediatrics', description: 'Infant and child care', icon: 'BabyIcon' },
      { name: 'Dermatology', description: 'Skin, hair, and nail care', icon: 'DropletIcon' },
      { name: 'Ophthalmology', description: 'Eye and vision care', icon: 'EyeIcon' },
    ]);
    console.log(`Created ${newDepts.length} departments.`);

    // Helper to create doctor
    const createDoc = async (name, email, dept, spec, exp) => {
      const user = await User.create({
        name,
        email,
        password: 'password123',
        role: ROLES.DOCTOR,
        phone: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        isEmailVerified: true,
      });

      await Doctor.create({
        user: user._id,
        department: dept._id,
        specialization: spec,
        qualifications: ['MBBS', 'MD'],
        experienceYears: exp,
        licenseNumber: `LIC-${Math.floor(Math.random() * 10000)}`,
        consultationFee: 500 + Math.floor(Math.random() * 1000),
        bio: `Expert ${spec} with over ${exp} years of clinical experience.`,
        isAvailable: true,
        availability: [
          { day: 'monday', startTime: '10:00', endTime: '14:00', slotDurationMinutes: 30 },
          { day: 'wednesday', startTime: '10:00', endTime: '14:00', slotDurationMinutes: 30 },
          { day: 'friday', startTime: '10:00', endTime: '14:00', slotDurationMinutes: 30 },
        ],
      });
      console.log(`Created doctor: ${name} (${email})`);
    };

    // 2. Add doctors
    console.log('Creating doctors...');
    await createDoc('Dr. Rahul Verma', 'rahul.ortho@hms.com', newDepts[0], 'Orthopedic Surgeon', 15);
    await createDoc('Dr. Sneha Joshi', 'sneha.ortho@hms.com', newDepts[0], 'Sports Medicine', 8);

    await createDoc('Dr. Amit Patel', 'amit.pedia@hms.com', newDepts[1], 'Pediatrician', 12);
    
    await createDoc('Dr. Priya Singh', 'priya.derma@hms.com', newDepts[2], 'Dermatologist', 10);
    
    await createDoc('Dr. Vikram Rao', 'vikram.eye@hms.com', newDepts[3], 'Ophthalmologist', 20);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

runSeed();
