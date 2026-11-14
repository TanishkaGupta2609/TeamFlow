/**
 * Standard API response builders matching the TeamFlow specification.
 */
export const sendSuccess = (res, data = {}, message = 'Operation completed successfully', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = 'An unexpected error occurred', statusCode = 500, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export const sendPaginated = (res, data = [], pagination = {}, message = 'Data retrieved successfully', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      totalItems: pagination.total || data.length,
      totalPages: pagination.pages || Math.ceil((pagination.total || data.length) / (pagination.limit || 10)),
      hasNext: pagination.page < pagination.pages,
      hasPrev: pagination.page > 1,
    },
  });
};
