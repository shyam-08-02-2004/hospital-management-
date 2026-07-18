const expressAsyncHandler = require('express-async-handler');
const BloodStock = require('../models/BloodStock');
const MedicineInventory = require('../models/MedicineInventory');

// --- BLOOD BANK ---

// Get all blood stock
const getBloodStock = expressAsyncHandler(async (req, res) => {
  const stock = await BloodStock.find().sort('bloodGroup');
  res.status(200).json({ success: true, stock });
});

// Update blood stock
const updateBloodStock = expressAsyncHandler(async (req, res) => {
  const { bloodGroup, units } = req.body;
  
  let stock = await BloodStock.findOne({ bloodGroup });
  
  if (stock) {
    stock.units = units;
    stock.lastUpdatedBy = req.user._id;
    await stock.save();
  } else {
    stock = await BloodStock.create({
      bloodGroup,
      units,
      lastUpdatedBy: req.user._id
    });
  }

  res.status(200).json({ success: true, stock });
});


// --- PHARMACY ---

// Get all medicines
const getMedicines = expressAsyncHandler(async (req, res) => {
  const medicines = await MedicineInventory.find().sort('name');
  res.status(200).json({ success: true, medicines });
});

// Add new medicine
const addMedicine = expressAsyncHandler(async (req, res) => {
  const { name, category, stock, price, expiryDate } = req.body;
  
  const medicine = await MedicineInventory.create({
    name,
    category,
    stock,
    price,
    expiryDate,
    lastUpdatedBy: req.user._id
  });

  res.status(201).json({ success: true, medicine });
});

// Update medicine stock
const updateMedicine = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock, price } = req.body;

  const medicine = await MedicineInventory.findById(id);
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  if (stock !== undefined) medicine.stock = stock;
  if (price !== undefined) medicine.price = price;
  medicine.lastUpdatedBy = req.user._id;

  await medicine.save();
  res.status(200).json({ success: true, medicine });
});

// Delete medicine
const deleteMedicine = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const medicine = await MedicineInventory.findById(id);
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  await medicine.deleteOne();
  res.status(200).json({ success: true, message: 'Medicine removed' });
});

module.exports = {
  getBloodStock,
  updateBloodStock,
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine
};
