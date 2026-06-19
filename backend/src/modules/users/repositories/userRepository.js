const User = require('../models/User');

const userRepository = {
  create(user) {
    return User.create(user);
  },

  findById(userId) {
    return User.findById(userId);
  },

  findPublicById(userId) {
    return User.findById(userId);
  },

  findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  },

  findByFirebaseUid(firebaseUid) {
    return User.findOne({ firebaseUid });
  },

  updateById(userId, updates) {
    return User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  },

  updateByFirebaseUid(firebaseUid, updates) {
    return User.findOneAndUpdate({ firebaseUid }, updates, { new: true, runValidators: true });
  },
};

module.exports = { userRepository };
