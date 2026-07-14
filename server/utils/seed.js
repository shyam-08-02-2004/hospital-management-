require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { User, Doctor, Patient, Department, Appointment, Prescription, MedicalReport, Payment, Notification } = require('../models');
const { ROLES } = require('./constants');

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Department.deleteMany({}),
      Appointment.deleteMany({}),
      Prescription.deleteMany({}),
      MedicalReport.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('Database cleared.');

    // 1. Seed Departments
    console.log('Seeding Departments...');
    const departmentsData = [
      { name: 'Cardiology', description: 'Comprehensive heart care, diagnosis, and surgical services.', icon: 'HeartIcon' },
      { name: 'Neurology', description: 'Advanced diagnosis and treatment for brain, spine, and nerve disorders.', icon: 'BrainIcon' },
      { name: 'Pediatrics', description: 'Dedicated healthcare services for infants, children, and adolescents.', icon: 'BabyIcon' },
      { name: 'Orthopedics', description: 'Expert treatment for bones, joints, ligaments, tendons, and muscles.', icon: 'BoneIcon' },
      { name: 'General Medicine', description: 'Primary healthcare, chronic disease management, and general wellness.', icon: 'StethoscopeIcon' },
    ];
    const departments = await Department.create(departmentsData);
    console.log(`Seeded ${departments.length} departments.`);

    // 2. Seed Admin User
    console.log('Seeding Admin User...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@hms.com',
      password: 'adminpassword123',
      role: ROLES.ADMIN,
      phone: '+15550100',
      isEmailVerified: true,
    });
    console.log(`Seeded Admin User: ${adminUser.email}`);

    // 3. Seed Doctors
    console.log('Seeding Doctors...');
    const doctorUsersData = [
      { name: 'Dr. Sarah Connor', email: 'sarah.connor@hms.com', password: 'password123', role: ROLES.DOCTOR, phone: '+15550101', isEmailVerified: true },
      { name: 'Dr. John Doe', email: 'john.doe@hms.com', password: 'password123', role: ROLES.DOCTOR, phone: '+15550102', isEmailVerified: true },
      { name: 'Dr. Gregory House', email: 'gregory.house@hms.com', password: 'password123', role: ROLES.DOCTOR, phone: '+15550103', isEmailVerified: true },
    ];

    const doctorUsers = await Promise.all(doctorUsersData.map(u => User.create(u)));

    const availability = [
      { day: 'monday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
      { day: 'monday', startTime: '14:00', endTime: '17:00', slotDurationMinutes: 30 },
      { day: 'tuesday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
      { day: 'wednesday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
      { day: 'thursday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
      { day: 'friday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
    ];

    const doctorsData = [
      {
        user: doctorUsers[0]._id,
        department: departments[0]._id, // Cardiology
        specialization: 'Interventional Cardiology',
        qualifications: ['MD - Cardiology', 'FACC'],
        experienceYears: 12,
        licenseNumber: 'LIC-CARD-001',
        consultationFee: 1500,
        bio: 'Dr. Sarah Connor specializes in interventional cardiology and preventative heart care.',
        availability,
      },
      {
        user: doctorUsers[1]._id,
        department: departments[1]._id, // Neurology
        specialization: 'Neurological Disorders',
        qualifications: ['MD - Neurology', 'PhD'],
        experienceYears: 8,
        licenseNumber: 'LIC-NEUR-002',
        consultationFee: 1200,
        bio: 'Dr. John Doe is dedicated to curing neurological diseases with state-of-the-art diagnostics.',
        availability,
      },
      {
        user: doctorUsers[2]._id,
        department: departments[4]._id, // General Medicine
        specialization: 'Diagnostic Medicine',
        qualifications: ['MD - Internal Medicine', 'Board Certified'],
        experienceYears: 20,
        licenseNumber: 'LIC-GEN-003',
        consultationFee: 2000,
        bio: 'Dr. Gregory House is a world-renowned diagnostician focusing on rare infectious diseases.',
        availability,
      },
    ];

    const doctors = await Promise.all(doctorsData.map(d => Doctor.create(d)));
    console.log(`Seeded ${doctors.length} doctor profiles.`);

    // 4. Seed Patients
    console.log('Seeding Patients...');
    const patientUsersData = [
      { name: 'Alice Smith', email: 'alice@gmail.com', password: 'password123', role: ROLES.PATIENT, phone: '+15550201', isEmailVerified: true },
      { name: 'Bob Johnson', email: 'bob@gmail.com', password: 'password123', role: ROLES.PATIENT, phone: '+15550202', isEmailVerified: true },
    ];

    const patientUsers = await Promise.all(patientUsersData.map(u => User.create(u)));

    const patientsData = [
      {
        user: patientUsers[0]._id,
        dateOfBirth: new Date('1995-05-15'),
        gender: 'female',
        bloodGroup: 'O+',
        address: { street: '123 Pine St', city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
        emergencyContact: { name: 'Charlie Smith', phone: '+15550299', relation: 'Spouse' },
        allergies: ['Penicillin'],
        chronicConditions: ['Asthma'],
        medicalHistorySummary: 'Patient has a history of seasonal asthma. Allergic to penicillin.',
      },
      {
        user: patientUsers[1]._id,
        dateOfBirth: new Date('1988-11-23'),
        gender: 'male',
        bloodGroup: 'A-',
        address: { street: '456 Oak Rd', city: 'Gotham', state: 'NJ', zip: '07001', country: 'USA' },
        emergencyContact: { name: 'Daisy Johnson', phone: '+15550298', relation: 'Mother' },
        allergies: [],
        chronicConditions: ['Hypertension'],
        medicalHistorySummary: 'Diagnosed with hypertension in 2024. Currently managed on diet.',
      },
    ];

    const patients = await Promise.all(patientsData.map(p => Patient.create(p)));
    console.log(`Seeded ${patients.length} patient profiles.`);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
