import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const body = await request.json();

  const res = await fetch(`${BACKEND_URL}/api/timeline/spending`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
