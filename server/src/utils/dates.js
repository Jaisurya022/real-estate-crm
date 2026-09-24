const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Start and end of "today" in the user's own timezone.
 *
 * The API may run in UTC (Vercel, Render) while the sales team works in IST,
 * so "follow-ups due today" must be computed with the client's offset.
 * `tzOffset` is the value of `new Date().getTimezoneOffset()` in the browser
 * (IST = -330).
 */
export function getDayBounds(tzOffset = 0, now = new Date()) {
  const offsetMs = tzOffset * 60 * 1000;
  const localNow = new Date(now.getTime() - offsetMs);
  localNow.setUTCHours(0, 0, 0, 0);

  const start = new Date(localNow.getTime() + offsetMs);
  const end = new Date(start.getTime() + DAY_MS);
  return { start, end };
}

export function daysAgo(days, from = new Date()) {
  return new Date(from.getTime() - days * DAY_MS);
}

export function startOfMonth(tzOffset = 0, now = new Date()) {
  const offsetMs = tzOffset * 60 * 1000;
  const local = new Date(now.getTime() - offsetMs);
  local.setUTCDate(1);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + offsetMs);
}
