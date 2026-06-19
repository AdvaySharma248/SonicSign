const mongoose = require('mongoose');
const { ROLES } = require('../../../constants/roles');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    displayName: { type: String, trim: true, maxlength: 120 },
    avatar: { type: String },
    organization: { type: String, trim: true, maxlength: 160 },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
      compactMode: { type: Boolean, default: false },
      fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    },
    notificationSettings: {
      emailOnSignature: { type: Boolean, default: true },
      emailOnRejection: { type: Boolean, default: true },
      emailOnExpiry: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: true },
    },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.OWNER },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
