const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { env } = require('../config/env');

const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadRoot, { recursive: true });

const localStorage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadRoot),
  filename: (_request, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    callback(null, `${Date.now()}-${safeName}`);
  },
});

function getAbsolutePath(fileName) {
  const filePath = path.resolve(uploadRoot, fileName);
  if (filePath !== uploadRoot && !filePath.startsWith(`${uploadRoot}${path.sep}`)) {
    throw new Error('Invalid upload file path');
  }
  return filePath;
}

module.exports = { localStorage, getAbsolutePath };
