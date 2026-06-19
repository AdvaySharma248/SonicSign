const { admin, isConfigured } = require('../config/firebase/firebaseAdmin');
const { getAuth } = require('firebase-admin/auth');
const { userRepository } = require('../modules/users/repositories/userRepository');
const { AppError } = require('../utils/AppError');

async function verifyFirebaseToken(request, response, next) {
  try {
    const header = request.headers.authorization || '';
    const [, token] = header.split(' ');

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    let decodedToken;

    if (!isConfigured) {
      throw new AppError('Firebase Auth is not configured on the server', 500);
    }

    decodedToken = await getAuth().verifyIdToken(token);

    if (!decodedToken.email_verified) {
      throw new AppError('Email verification required. Please verify your email first.', 403);
    }

    // Sync user with MongoDB database
    let user = await userRepository.findByFirebaseUid(decodedToken.uid);
    if (!user) {
      // Create user document if not already present
      user = await userRepository.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        displayName: decodedToken.name || decodedToken.email.split('@')[0],
        avatar: decodedToken.picture || '',
        role: 'owner',
        isActive: true,
        lastLoginAt: new Date(),
      });
    } else {
      // Future logins should update user information
      user = await userRepository.updateByFirebaseUid(decodedToken.uid, {
        email: decodedToken.email,
        name: user.name || decodedToken.name || decodedToken.email.split('@')[0],
        displayName: user.displayName || user.name || decodedToken.name || decodedToken.email.split('@')[0],
        avatar: user.avatar || decodedToken.picture || '',
        lastLoginAt: new Date(),
      });
    }

    // Attach user to request
    request.user = user;
    next();
  } catch (error) {
    if (error.statusCode) {
      return next(error);
    }
    console.error('Firebase token verification failed:', error);
    return next(new AppError('Invalid or expired authentication token', 401));
  }
}

module.exports = { verifyFirebaseToken };
