const { validationResult } = require('express-validator');
const { AppError } = require('../utils/AppError');

function validate(request, _response, next) {
  const validation = validationResult(request);
  if (validation.isEmpty()) {
    return next();
  }

  const errors = validation.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return next(new AppError('Request validation failed', 400, errors));
}

module.exports = { validate };
