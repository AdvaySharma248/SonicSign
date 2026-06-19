const { expireSigningLinksJob } = require('./expireSigningLinksJob');
const { cleanupUploadsJob } = require('./cleanupUploadsJob');
const { processEmailQueue } = require('./emailQueueJob');

function startJobs() {
  setInterval(expireSigningLinksJob, 60 * 60 * 1000).unref();
  setInterval(cleanupUploadsJob, 6 * 60 * 60 * 1000).unref();
  setInterval(processEmailQueue, 5000).unref();
}

module.exports = { startJobs };
