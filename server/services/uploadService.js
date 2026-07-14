const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key'
  );
};

/**
 * Uploads a file (either buffer or disk path) to Cloudinary or falls back to local storage.
 * @param {Object} file - Multer file object
 * @param {string} folder - Destination folder name
 * @returns {Promise<Object>} { url, publicId }
 */
const uploadFile = async (file, folder = 'hms') => {
  if (!file) return null;

  if (isCloudinaryConfigured()) {
    try {
      // Cloudinary upload using stream
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: folder, resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve({ url: result.secure_url, publicId: result.public_id });
          }
        );
        stream.end(file.buffer);
      });
    } catch (error) {
      console.error('[UploadService] Cloudinary upload failed, falling back to local:', error.message);
    }
  }

  // Fallback: Local storage
  const uploadDir = path.join(__dirname, '..', 'uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  const filePath = path.join(uploadDir, filename);

  // Write file from buffer
  fs.writeFileSync(filePath, file.buffer);

  // Return relative path
  const url = `/uploads/${folder}/${filename}`;
  return {
    url,
    publicId: url, // Use URL as identifier for local delete
  };
};

/**
 * Deletes a file from Cloudinary or local storage.
 * @param {string} publicId - Cloudinary publicId or local URL path
 */
const deleteFile = async (publicId) => {
  if (!publicId) return;

  if (publicId.startsWith('/uploads/')) {
    // Local deletion
    const filePath = path.join(__dirname, '..', publicId);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('[UploadService] Local file deletion failed:', err.message);
      }
    }
  } else if (isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('[UploadService] Cloudinary deletion failed:', err.message);
    }
  }
};

module.exports = {
  uploadFile,
  deleteFile,
};
