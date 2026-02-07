import { supabase } from './supabase';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

/**
 * Get the current Supabase auth token for backend API calls.
 */
export async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Fetch wrapper that automatically attaches the Supabase JWT
 * as an Authorization header for backend API calls.
 */
export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await getAuthToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(`${BACKEND_URL}${path}`, { ...init, headers });
}
