const mongoose = require('mongoose');

const medicineInventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicineInventory', medicineInventorySchema);
