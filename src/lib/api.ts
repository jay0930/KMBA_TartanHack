/**
 * Fetch wrapper that routes backend API calls through dedicated Next.js routes.
 * Maps known paths to their dedicated routes, falls back to proxy for unknown paths.
 */
const ROUTE_MAP: Record<string, string> = {
  '/api/emoji/assign': '/api/emoji',
  '/api/auth/google/status': '/api/auth/google-status',
};
export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  // Strip query string for matching, then reattach
  const [basePath, query] = path.split('?');
  const mapped = ROUTE_MAP[basePath] || basePath;
  const url = query ? `${mapped}?${query}` : mapped;
  return fetch(url, init);
}

/**
 * Get current user from cookie auth. Returns null if not logged in.
 */
export async function fetchCurrentUser() {
  const res = await fetch('/api/auth/me');
  const { user } = await res.json();
  return user as { id: string; email: string; name: string; profile_image: string | null } | null;
}
