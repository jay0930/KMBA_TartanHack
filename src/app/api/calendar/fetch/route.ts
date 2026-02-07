import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { BACKEND_URL } from '@/lib/backend-url';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  for (const [key, value] of searchParams) {
    params.set(key, value);
  }

  const res = await fetch(`${BACKEND_URL}/api/calendar/fetch?${params}`, {
    headers: { 'X-User-Id': user.id },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
