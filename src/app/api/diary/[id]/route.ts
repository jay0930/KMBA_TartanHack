import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { BACKEND_URL } from '@/lib/backend-url';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const { id } = await params;

  const res = await fetch(`${BACKEND_URL}/api/diary/${id}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': user.id },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
