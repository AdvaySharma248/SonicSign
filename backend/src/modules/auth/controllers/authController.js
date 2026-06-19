const { sendSuccess } = require('../../../utils/apiResponse');
const { asyncHandler } = require('../../../utils/asyncHandler');

const authController = {
  me: asyncHandler(async (request, response) => {
    sendSuccess(response, 200, 'Current user fetched successfully', { user: request.user });
  }),
};

module.exports = { authController };
