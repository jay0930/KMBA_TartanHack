import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

import { BACKEND_URL } from '@/lib/backend-url';

async function proxyToBackend(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const user = await getCurrentUser();
  const { path } = await params;
  const backendPath = '/' + path.join('/');

  // Build URL with query params
  const url = new URL(request.url);
  const fullUrl = `${BACKEND_URL}${backendPath}${url.search}`;

  // Forward headers, add X-User-Id
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  if (user) headers.set('X-User-Id', user.id);

  // Forward body for non-GET requests
  let body: BodyInit | null = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (contentType?.includes('multipart/form-data')) {
      // For multipart, forward raw body and let browser set boundary
      body = await request.arrayBuffer();
      // Re-set the original content-type with boundary
      headers.set('content-type', contentType);
    } else {
      body = await request.text();
    }
  }

  const res = await fetch(fullUrl, {
    method: request.method,
    headers,
    body,
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
  });
}

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PUT = proxyToBackend;
export const DELETE = proxyToBackend;
export const PATCH = proxyToBackend;
