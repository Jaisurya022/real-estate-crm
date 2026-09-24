/** Escape user input before using it inside a RegExp. */
export function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive "contains" matcher for search boxes. */
export function containsRegex(value) {
  return new RegExp(escapeRegex(value.trim()), 'i');
}

/** Standard paginated payload shape used by every list endpoint. */
export function paginate({ page = 1, limit = 20 }) {
  const safeLimit = Math.min(Math.max(limit, 1), 500);
  const safePage = Math.max(page, 1);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

export function pagedResponse(items, total, { page, limit }) {
  return { items, total, page, pages: Math.max(Math.ceil(total / limit), 1) };
}
