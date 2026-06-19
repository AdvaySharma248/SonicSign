const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.accessTokenSecret, {
    expiresIn: env.accessTokenTtl,
  });
}

function signRefreshToken(user, tokenId) {
  return jwt.sign({ sub: user.id, tokenId }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenTtl,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.accessTokenSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshTokenSecret);
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  createOpaqueToken,
};
