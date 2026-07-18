const mongoose = require('mongoose');
const { User, Doctor, Patient, Department } = require('../models');
const { ROLES } = require('../utils/constants');

let isConnected = false;

const ensureDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  await mongoose.connect(uri);
  isConnected = true;
};

const runSeed = async (req, res) => {
  try {
    await ensureDB();

    const adminExists = await User.findOne({ email: 'admin@hms.com' });
    if (adminExists) {
      return res.json({ success: true, message: 'Already seeded' });
    }

    const departments = await Department.create([
      { name: 'Cardiology', description: 'Heart care', icon: 'HeartIcon' },
      { name: 'Neurology', description: 'Brain care', icon: 'BrainIcon' },
      { name: 'General Medicine', description: 'General care', icon: 'StethoscopeIcon' },
    ]);

    await User.create({
      name: 'System Administrator',
      email: 'admin@hms.com',
      password: 'adminpassword123',
      role: ROLES.ADMIN,
      phone: '+15550100',
      isEmailVerified: true,
    });

    const doctorUser = await User.create({
      name: 'Dr. Sarah Connor',
      email: 'sarah.connor@hms.com',
      password: 'password123',
      role: ROLES.DOCTOR,
      phone: '+15550101',
      isEmailVerified: true,
    });

    await Doctor.create({
      user: doctorUser._id,
      department: departments[0]._id,
      specialization: 'Cardiology',
      qualifications: ['MD'],
      experienceYears: 12,
      licenseNumber: 'LIC-1',
      consultationFee: 1500,
      bio: 'Expert cardiologist',
      availability: [{ day: 'monday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 }],
    });

    const patientUser = await User.create({
      name: 'Alice Smith',
      email: 'alice@gmail.com',
      password: 'password123',
      role: ROLES.PATIENT,
      phone: '+15550201',
      isEmailVerified: true,
    });

    await Patient.create({
      user: patientUser._id,
      dateOfBirth: new Date('1995-05-15'),
      gender: 'female',
      bloodGroup: 'O+',
      address: { street: '123 St', city: 'City', state: 'ST', zip: '10001', country: 'US' },
      emergencyContact: { name: 'Bob', phone: '+1555', relation: 'Brother' },
    });

    res.json({ success: true, message: 'Seeded: admin@hms.com / adminpassword123, sarah.connor@hms.com / password123, alice@gmail.com / password123' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
};

module.exports = runSeed;
