import { tokenStorage } from './token';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

/** Error thrown for every failed request, with a message that is safe to show. */
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  /** Field errors from the API as `{ fieldName: message }`, ready for forms. */
  get fieldErrors() {
    if (!Array.isArray(this.details)) return {};
    return Object.fromEntries(this.details.filter((d) => d.field).map((d) => [d.field, d.message]));
  }
}

let onUnauthorized = null;

/** AuthContext registers a callback here so an expired session signs the user out. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/** Drop empty filters ("", null, "all") so the API only receives real values. */
function buildUrl(path, params) {
  const url = new URL(`${API_URL}/api${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    url.searchParams.set(key, value);
  });
  return url;
}

async function request(path, { method = 'GET', body, params, signal } = {}) {
  const token = tokenStorage.get();
  const headers = {
    'Content-Type': 'application/json',
    // Lets the API compute "today" in the user's timezone.
    'X-TZ-Offset': String(new Date().getTimezoneOffset()),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.();
    throw new ApiError(data?.message || `Request failed (${response.status}).`, response.status, data?.details);
  }

  return data;
}

export const api = {
  get: (path, params, options) => request(path, { ...options, params }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
};
