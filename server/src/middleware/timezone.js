/**
 * Reads the browser's timezone offset (minutes, as returned by
 * `Date#getTimezoneOffset`) so date-based filters like "due today" match
 * the user's calendar day. Defaults to UTC.
 */
export function timezone(req, _res, next) {
  const offset = Number(req.headers['x-tz-offset']);
  req.tzOffset = Number.isFinite(offset) && Math.abs(offset) <= 840 ? offset : 0;
  next();
}
