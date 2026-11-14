/**
 * 404 Not Found Middleware
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized Exception Handling Middleware
 * Matches exact TeamFlow error specification:
 * {
 *   "success": false,
 *   "message": "Meaningful error message",
 *   "errors": []
 * }
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'resource';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value error: ${field} '${value}' already exists`;
    errors = [{ field, message: `${field} must be unique` }];
  }

  // Mongoose Bad ObjectId (CastError)
  else if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `Resource not found with identifier '${err.value}'`;
    errors = [{ field: err.path, message: 'Malformed identifier' }];
  }

  // Mongoose Schema Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed on submitted database attributes';
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
  }

  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errors = [{ field: 'token', message: 'Token authorization signature invalid' }];
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    errors = [{ field: 'token', message: 'Token has expired. Please refresh session' }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
