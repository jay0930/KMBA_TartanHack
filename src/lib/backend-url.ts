const raw = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
export const BACKEND_URL = raw.startsWith('http') ? raw : `https://${raw}`;
