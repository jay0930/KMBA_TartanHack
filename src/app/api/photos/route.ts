import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const formData = await request.formData();

  const res = await fetch(`${BACKEND_URL}/api/photos/analyze`, {
    method: 'POST',
    headers: { 'X-User-Id': user.id },
    body: formData,
  });
  const data = await res.json();
  return NextResponse.json(data);
}
