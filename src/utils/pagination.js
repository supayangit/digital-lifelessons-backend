/**
 * Parses pagination parameters from query string.
 * @param {Object} query - Express req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Builds the pagination metadata object for API responses.
 * @param {{ page: number, limit: number, total: number }} options
 * @returns {Object}
 */
export function buildPaginationMeta({ page, limit, total }) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
