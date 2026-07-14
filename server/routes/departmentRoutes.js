const express = require('express');
const router = express.Router();
const { getDepartments, getDepartmentBySlug, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/', getDepartments);
router.get('/:slug', getDepartmentBySlug);

// Admin-only operations
router.post('/', protect, restrictTo('admin'), createDepartment);
router.put('/:id', protect, restrictTo('admin'), updateDepartment);
router.delete('/:id', protect, restrictTo('admin'), deleteDepartment);

module.exports = router;
