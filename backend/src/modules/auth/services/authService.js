const crypto = require('crypto');
const { userRepository } = require('../../users/repositories/userRepository');
const { refreshTokenRepository } = require('../repositories/refreshTokenRepository');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../../utils/token');
const { AppError } = require('../../../utils/AppError');
const { env } = require('../../../config/env');
const { auditService } = require('../../audit/services/auditService');
const { AUDIT_ACTIONS } = require('../../../constants/auditActions');

function refreshExpiry() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

async function issueTokens(user) {
  const tokenRecord = await refreshTokenRepository.create({
    userId: user.id,
    tokenId: crypto.randomUUID(),
    expiresAt: refreshExpiry(),
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user, tokenRecord.tokenId),
  };
}

function applyRefreshCookie(response, refreshToken) {
  response.cookie(env.refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

const authService = {
  async register(payload, request) {
    const existingUser = await userRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    const user = await userRepository.create(payload);
    await auditService.record({
      userId: user.id,
      action: AUDIT_ACTIONS.USER_REGISTERED,
      description: `${user.email} registered`,
      request,
    });

    const tokens = await issueTokens(user);
    return { user: await userRepository.findPublicById(user.id), tokens };
  },

  async login(email, password, request) {
    const user = await userRepository.findByEmail(email, true);
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    await auditService.record({
      userId: user.id,
      action: AUDIT_ACTIONS.USER_LOGIN,
      description: `${user.email} logged in`,
      request,
    });

    return { user: await userRepository.findPublicById(user.id), tokens: await issueTokens(user) };
  },

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 401);
    }

    const payload = verifyRefreshToken(refreshToken);
    const tokenRecord = await refreshTokenRepository.findActive(payload.tokenId);
    if (!tokenRecord) {
      throw new AppError('Refresh token is invalid or expired', 401);
    }

    await refreshTokenRepository.revoke(payload.tokenId);
    const user = await userRepository.findById(payload.sub);
    return { user: await userRepository.findPublicById(user.id), tokens: await issueTokens(user) };
  },

  async logout(refreshToken) {
    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      await refreshTokenRepository.revoke(payload.tokenId);
    }
  },

  async changePassword(userId, currentPassword, nextPassword) {
    const user = await userRepository.findById(userId).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      throw new AppError('Current password is incorrect', 400);
    }

    user.password = nextPassword;
    await user.save();
    await refreshTokenRepository.revokeAllForUser(userId);
  },

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      return;
    }

    user.passwordResetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    return user.passwordResetToken;
  },

  async resetPassword(token, password) {
    const foundUser = await userRepository.findByPasswordResetToken(token);

    if (!foundUser) {
      throw new AppError('Password reset token is invalid or expired', 400);
    }

    foundUser.password = password;
    foundUser.passwordResetToken = undefined;
    foundUser.passwordResetExpiresAt = undefined;
    await foundUser.save();
    await refreshTokenRepository.revokeAllForUser(foundUser.id);
  },

  applyRefreshCookie,
  clearRefreshCookie(response) {
    response.clearCookie(env.refreshCookieName);
  },
};

module.exports = { authService };
