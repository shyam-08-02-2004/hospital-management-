const expressAsyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Department = require('../models/Department');
const slugify = require('slugify');

/**
 * Get all departments
 */
const getDepartments = expressAsyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true }).populate('doctors');

  res.status(200).json({
    success: true,
    count: departments.length,
    departments,
  });
});

/**
 * Get department by slug
 */
const getDepartmentBySlug = expressAsyncHandler(async (req, res) => {
  const department = await Department.findOne({ slug: req.params.slug, isActive: true }).populate('doctors');

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  res.status(200).json({
    success: true,
    department,
  });
});

/**
 * Create a new department (Admin only)
 */
const createDepartment = expressAsyncHandler(async (req, res) => {
  const { name, description, icon } = req.body;

  const existing = await Department.findOne({ name });
  if (existing) {
    throw new ApiError(400, 'Department name already exists');
  }

  const department = await Department.create({ name, description, icon });

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    department,
  });
});

/**
 * Update a department (Admin only)
 */
const updateDepartment = expressAsyncHandler(async (req, res) => {
  const { name, description, icon, isActive } = req.body;
  const department = await Department.findById(req.params.id);

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  if (name) department.name = name;
  if (description) department.description = description;
  if (icon) department.icon = icon;
  if (isActive !== undefined) department.isActive = isActive;

  await department.save();

  res.status(200).json({
    success: true,
    message: 'Department updated successfully',
    department,
  });
});

/**
 * Delete a department (Admin only)
 */
const deleteDepartment = expressAsyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  // Soft delete / toggle active rather than hard delete to preserve historical records
  department.isActive = false;
  await department.save();

  res.status(200).json({
    success: true,
    message: 'Department deleted (deactivated) successfully',
  });
});

module.exports = {
  getDepartments,
  getDepartmentBySlug,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
