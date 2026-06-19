const { dashboardService } = require('../services/dashboardService');
const { sendSuccess } = require('../../../utils/apiResponse');
const { asyncHandler } = require('../../../utils/asyncHandler');

const dashboardController = {
  summary: asyncHandler(async (request, response) => {
    const dashboard = await dashboardService.summary(request.user);
    sendSuccess(response, 200, 'Dashboard summary fetched successfully', dashboard);
  }),
};

module.exports = { dashboardController };
