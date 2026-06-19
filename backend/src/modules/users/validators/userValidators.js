const { body } = require('express-validator');

const updateProfileRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 120 }),
  body('displayName').optional().trim().notEmpty().withMessage('Display name cannot be empty').isLength({ max: 120 }),
  body('avatar').optional().isURL().withMessage('Avatar must be a URL'),
  body('photoURL').optional().isURL().withMessage('Photo URL must be a URL'),
  body('organization').optional().trim().isLength({ max: 160 }),
  body('preferences.theme').optional().isIn(['light', 'dark', 'system']),
  body('preferences.compactMode').optional().isBoolean(),
  body('preferences.fontSize').optional().isIn(['small', 'medium', 'large']),
  body('notificationSettings.emailOnSignature').optional().isBoolean(),
  body('notificationSettings.emailOnRejection').optional().isBoolean(),
  body('notificationSettings.emailOnExpiry').optional().isBoolean(),
  body('notificationSettings.weeklyDigest').optional().isBoolean(),
];

module.exports = { updateProfileRules };
