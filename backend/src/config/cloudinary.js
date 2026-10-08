// Cloudinary configuration
// Not connected in Phase 1 — will be implemented when file uploads are needed.
const { env } = require('./env');

const cloudinaryConfig = {
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
};

module.exports = cloudinaryConfig;
