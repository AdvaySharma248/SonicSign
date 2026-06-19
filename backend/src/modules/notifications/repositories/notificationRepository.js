const Notification = require('../models/Notification');

const notificationRepository = {
  create(notification) {
    return Notification.create(notification);
  },

  updateById(notificationId, updates) {
    return Notification.findByIdAndUpdate(notificationId, updates, { new: true });
  },
};

module.exports = { notificationRepository };
