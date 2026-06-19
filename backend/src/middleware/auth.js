const { verifyFirebaseToken } = require('./verifyFirebaseToken');
const { AppError } = require('../utils/AppError');

function requireRole(...roles) {
  return (request, _response, next) => {
    if (!roles.includes(request.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    return next();
  };
}

module.exports = { requireAuth: verifyFirebaseToken, requireRole };

