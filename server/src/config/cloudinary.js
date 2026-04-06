const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Custom multer storage engine for cloudinary v2
const cloudinaryStorage = {
  _handleFile(req, file, cb) {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'fundsdb/beneficiaries',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        transformation: [{ width: 800, quality: 'auto' }],
      },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        });
      }
    );
    file.stream.pipe(uploadStream);
  },
  _removeFile(req, file, cb) {
    if (file.filename) {
      cloudinary.uploader.destroy(file.filename, cb);
    } else {
      cb(null);
    }
  },
};

const upload = multer({ storage: cloudinaryStorage });

module.exports = { cloudinary, upload };
