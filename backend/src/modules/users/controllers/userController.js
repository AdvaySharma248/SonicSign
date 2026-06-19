const { userRepository } = require('../repositories/userRepository');
const { sendSuccess } = require('../../../utils/apiResponse');
const { asyncHandler } = require('../../../utils/asyncHandler');

const userController = {
  updateProfile: asyncHandler(async (request, response) => {
    const allowedUpdates = {};
    const body = request.body || {};

    if (typeof body.displayName === 'string') {
      allowedUpdates.displayName = body.displayName;
      allowedUpdates.name = body.displayName;
    } else if (typeof body.name === 'string') {
      allowedUpdates.name = body.name;
      allowedUpdates.displayName = body.name;
    }
    if (typeof body.avatar === 'string') allowedUpdates.avatar = body.avatar;
    if (typeof body.photoURL === 'string') allowedUpdates.avatar = body.photoURL;
    if (typeof body.organization === 'string') allowedUpdates.organization = body.organization;
    if (body.preferences) allowedUpdates.preferences = body.preferences;
    if (body.notificationSettings) allowedUpdates.notificationSettings = body.notificationSettings;

    const user = await userRepository.updateById(request.user.id, allowedUpdates);
    sendSuccess(response, 200, 'Profile updated successfully', { user });
  }),
};

module.exports = { userController };
