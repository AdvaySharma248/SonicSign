const RefreshToken = require('../models/RefreshToken');

const refreshTokenRepository = {
  create(token) {
    return RefreshToken.create(token);
  },

  findActive(tokenId) {
    return RefreshToken.findOne({ tokenId, revokedAt: null, expiresAt: { $gt: new Date() } });
  },

  revoke(tokenId) {
    return RefreshToken.findOneAndUpdate({ tokenId }, { revokedAt: new Date() });
  },

  revokeAllForUser(userId) {
    return RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
  },
};

module.exports = { refreshTokenRepository };
