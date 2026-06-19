const { AppError } = require('../utils/AppError');

function errorHandler(error, _request, response, _next) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return response.status(400).json({
      success: false,
      message: 'File too large',
    });
  }
  if (error.name === 'MulterError') {
    return response.status(400).json({
      success: false,
      message: error.message,
    });
  }

  const isKnownError = error instanceof AppError || error.isOperational;
  const statusCode = isKnownError ? error.statusCode : 500;
  const message = isKnownError ? error.message : 'Internal server error';

  if (!isKnownError) {
    console.error(error);
  }

  response.status(statusCode).json({
    success: false,
    message,
    ...(error.details ? { errors: error.details } : {}),
  });
}

module.exports = { errorHandler };
