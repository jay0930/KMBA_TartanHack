import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { BACKEND_URL } from '@/lib/backend-url';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const res = await fetch(`${BACKEND_URL}/api/user?user_id=${user.id}`, {
    headers: { 'X-User-Id': user.id },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const body = await request.json();

  const res = await fetch(`${BACKEND_URL}/api/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
