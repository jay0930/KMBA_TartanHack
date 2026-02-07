import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  // Forward multipart form data directly to FastAPI backend
  const formData = await request.formData();

  const headers: Record<string, string> = {};
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(`${BACKEND_URL}/api/photos/analyze`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await res.json();
  return NextResponse.json(data);
}
