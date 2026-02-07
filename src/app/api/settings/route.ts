import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { DiarySettings, DiaryStyle } from '@/lib/types';

const COOKIE_NAME = 'dayflow-settings';
const VALID_STYLES: DiaryStyle[] = ['summary', 'friendly', 'emotional', 'poetic', 'humorous'];
const VALID_LANGUAGES = ['en', 'auto'] as const;

const DEFAULT_SETTINGS: DiarySettings = {
  style: 'friendly',
  language: 'en',
  includeSpending: true,
  includeSuggestion: true,
  customPrompt: '',
};

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;

  if (!raw) {
    return NextResponse.json(DEFAULT_SETTINGS);
  }

  try {
    const settings: DiarySettings = JSON.parse(raw);
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(request: Request) {
  const body = await request.json() as DiarySettings;

  // Validate style
  if (!VALID_STYLES.includes(body.style)) {
    return NextResponse.json(
      { error: `Invalid style. Must be one of: ${VALID_STYLES.join(', ')}` },
      { status: 400 },
    );
  }

  // Validate language
  if (!VALID_LANGUAGES.includes(body.language)) {
    return NextResponse.json(
      { error: 'Invalid language. Must be "en" or "ko"' },
      { status: 400 },
    );
  }

  const settings: DiarySettings = {
    style: body.style,
    language: body.language,
    includeSpending: Boolean(body.includeSpending),
    includeSuggestion: Boolean(body.includeSuggestion),
    customPrompt: body.customPrompt || '',
  };

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(settings), {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  });

  return NextResponse.json({ success: true, settings });
}
