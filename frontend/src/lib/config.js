/**
 * Central app config — change URLs in frontend/.env only (VITE_SERVER_URL).
 * Leave empty on the server when nginx/Docker proxies /api on the same domain.
 */
const serverUrl = (import.meta.env.VITE_SERVER_URL || '').replace(/\/$/, '');

export const API_BASE_URL = serverUrl ? `${serverUrl}/api` : '/api';

/** Same origin when empty — works with Vite dev proxy and production nginx. */
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || serverUrl || undefined;
