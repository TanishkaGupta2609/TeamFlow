/**
 * Query helper to parse pagination, sorting, and search params from req.query.
 */
export const getPagination = (query, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const getSort = (query, defaultSort = '-createdAt') => {
  if (!query.sortBy) return defaultSort;
  const order = query.order === 'asc' ? '' : '-';
  return `${order}${query.sortBy}`;
};

export const buildSearchQuery = (term, fields = []) => {
  if (!term || fields.length === 0) return {};
  const regex = new RegExp(term, 'i');
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};
