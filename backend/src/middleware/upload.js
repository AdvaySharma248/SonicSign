const multer = require('multer');
const path = require('path');
const { localStorage } = require('../storage/localStorage');
const { env } = require('../config/env');
const { AppError } = require('../utils/AppError');

const uploadPdf = multer({
  storage: localStorage,
  limits: { fileSize: env.maxUploadBytes },
  fileFilter: (_request, file, callback) => {
    if (file.mimetype !== 'application/pdf') {
      return callback(new AppError('Unsupported file type', 400));
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') {
      return callback(new AppError('Unsupported file type', 400));
    }
    return callback(null, true);
  },
});

module.exports = { uploadPdf };
