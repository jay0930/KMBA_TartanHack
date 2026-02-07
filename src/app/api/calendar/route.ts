import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const headers: Record<string, string> = {};
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(`${BACKEND_URL}/api/calendar/events?date=${date}`, { headers });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  const body = await request.json();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(`${BACKEND_URL}/api/calendar/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
