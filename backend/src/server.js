const { app } = require('./app');
const { connectDatabase } = require('./database/mongoose');
const { env } = require('./config/env');
const { startJobs } = require('./jobs');

let server;

async function start() {
  await connectDatabase();

  server = app.listen(env.port, () => {
    console.log(`SonicSign API listening on http://localhost:${env.port}`);
  });
  startJobs();
}

function shutdown(signal) {
  console.log(`${signal} received, closing SonicSign API`);
  if (!server) {
    process.exit(0);
  }
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((error) => {
  console.error('Unable to start SonicSign API', error);
  process.exit(1);
});
