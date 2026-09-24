const inrFull = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });

const DAY = 24 * 60 * 60 * 1000;

export const formatINR = (value) => (value == null ? '—' : inrFull.format(value));

/** Indian real-estate style: ₹85.5 L, ₹1.12 Cr. */
export function formatINRCompact(value) {
  if (value == null) return '—';
  if (value >= 1e7) return `₹${trim(value / 1e7)} Cr`;
  if (value >= 1e5) return `₹${trim(value / 1e5)} L`;
  return inrFull.format(value);
}

const trim = (n) => Number(n.toFixed(2)).toString();

export const formatDate = (value) => (value ? dateFmt.format(new Date(value)) : '—');

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return `${shortDateFmt.format(date)}, ${timeFmt.format(date)}`;
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Follow-up status relative to the user's calendar day:
 * { tone: 'overdue' | 'today' | 'upcoming', label: 'Overdue by 2 days' | 'Today, 4:30 pm' | 'Tomorrow, 10 am' | '28 Sep' }
 */
export function describeFollowUp(value) {
  if (!value) return null;
  const date = new Date(value);
  const days = Math.round((startOfDay(date) - startOfDay(new Date())) / DAY);

  if (days < 0) {
    const n = Math.abs(days);
    return { tone: 'overdue', label: `Overdue by ${n} day${n === 1 ? '' : 's'}` };
  }
  if (days === 0) return { tone: 'today', label: `Today, ${timeFmt.format(date)}` };
  if (days === 1) return { tone: 'upcoming', label: `Tomorrow, ${timeFmt.format(date)}` };
  return { tone: 'upcoming', label: shortDateFmt.format(date) };
}

/** "3 hours ago", "2 days ago" for timelines. */
export function timeAgo(value) {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(value);
}

/** Value for <input type="datetime-local"> in local time. */
export function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Local datetime-local string → ISO string for the API ('' stays '' to clear). */
export const fromDateTimeLocal = (value) => (value ? new Date(value).toISOString() : '');

/** A sensible default for "next follow-up": tomorrow at 11:00. */
export function tomorrowAt(hour = 11) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return toDateTimeLocal(date);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/** Pretty-print stored digits: 9840012345 → 98400 12345. */
export function formatPhone(phone = '') {
  return phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone;
}

/** Short, human booking reference derived from its id. */
export const bookingRef = (id = '') => `BK-${id.slice(-6).toUpperCase()}`;
