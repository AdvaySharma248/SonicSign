const { initializeApp, cert } = require('firebase-admin');
const { env } = require('../env');

let isConfigured = false;

if (env.firebaseProjectId) {
  try {
    if (env.firebaseClientEmail && env.firebasePrivateKey) {
      const privateKey = env.firebasePrivateKey.replace(/\\n/g, '\n');
      initializeApp({
        credential: cert({
          projectId: env.firebaseProjectId,
          clientEmail: env.firebaseClientEmail,
          privateKey: privateKey,
        }),
      });
      console.log('Firebase Admin SDK initialized successfully with service account cert.');
    } else {
      initializeApp({
        projectId: env.firebaseProjectId
      });
      console.log('Firebase Admin SDK initialized successfully in token-verification-only mode.');
    }
    isConfigured = true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
} else {
  console.warn('Firebase Admin credentials are not configured. Authenticated API requests will fail until Firebase is configured.');
}

module.exports = {
  admin: require('firebase-admin'),
  isConfigured,
};
