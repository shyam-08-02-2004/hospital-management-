const express = require('express');
const router = express.Router();
const {
  getBloodStock,
  updateBloodStock,
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine
} = require('../controllers/inventoryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public or Admin? Let's make it Admin only for editing, all staff for viewing
router.get('/blood', protect, getBloodStock);
router.put('/blood', protect, restrictTo('admin'), updateBloodStock);

router.get('/medicines', protect, getMedicines);
router.post('/medicines', protect, restrictTo('admin'), addMedicine);
router.put('/medicines/:id', protect, restrictTo('admin'), updateMedicine);
router.delete('/medicines/:id', protect, restrictTo('admin'), deleteMedicine);

module.exports = router;
