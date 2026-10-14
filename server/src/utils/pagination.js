// ?page=&limit= параметрлерин коопсуз санга айлантат
const parsePaging = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

const pageMeta = (total, page, limit) => ({
  total,
  page,
  pages: Math.max(1, Math.ceil(total / limit)),
});

module.exports = { parsePaging, pageMeta };
