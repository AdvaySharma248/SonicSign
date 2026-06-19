const fs = require('fs/promises');
const path = require('path');
const { env } = require('../config/env');

async function cleanupUploadsJob() {
  const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
  const files = await fs.readdir(uploadRoot, { withFileTypes: true }).catch(() => []);
  const staleBefore = Date.now() - 24 * 60 * 60 * 1000;

  await Promise.all(
    files
      .filter((file) => file.isFile() && file.name.endsWith('.tmp'))
      .map(async (file) => {
        const filePath = path.join(uploadRoot, file.name);
        const stats = await fs.stat(filePath);
        if (stats.mtimeMs < staleBefore) {
          await fs.unlink(filePath);
        }
      })
  );
}

module.exports = { cleanupUploadsJob };
