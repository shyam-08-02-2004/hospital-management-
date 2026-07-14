const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, trim: true },
    icon: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

departmentSchema.pre('save', function generateSlug(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual populate: doctors belonging to this department
departmentSchema.virtual('doctors', {
  ref: 'Doctor',
  localField: '_id',
  foreignField: 'department',
});

departmentSchema.set('toObject', { virtuals: true });
departmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Department', departmentSchema);
