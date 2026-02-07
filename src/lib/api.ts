/**
 * Fetch wrapper that routes all backend API calls through the Next.js proxy.
 * The proxy reads the cookie, adds X-User-Id, and forwards to FastAPI.
 *
 * Usage: backendFetch('/api/user') → fetch('/api/proxy/api/user')
 */
export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`/api/proxy${path}`, init);
}

/**
 * Get current user from cookie auth. Returns null if not logged in.
 */
export async function fetchCurrentUser() {
  const res = await fetch('/api/auth/me');
  const { user } = await res.json();
  return user as { id: string; email: string; name: string; profile_image: string | null } | null;
}
