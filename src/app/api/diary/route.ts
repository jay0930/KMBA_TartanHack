import { NextResponse } from 'next/server';
import { callDedalus, extractText } from '@/lib/dedalus';
import type { TimelineEvent } from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export async function POST(request: Request) {
  const { timeline }: { timeline: TimelineEvent[] } = await request.json();

  const totalSpending = timeline.reduce((sum, item) => sum + (item.spending || 0), 0);

  // Generate diary via Dedalus
  const diaryPrompt = `다음은 사용자의 오늘 하루 타임라인입니다:
${JSON.stringify(timeline, null, 2)}

총 지출: ${totalSpending}원

이 정보를 바탕으로:
1. 따뜻하고 개인적인 일기를 한국어로 작성해주세요 (200-300자)
2. 내일을 위한 한 줄 제안을 해주세요

JSON 형태로 반환: { "diary_text": "...", "spending_insight": "...", "tomorrow_suggestion": "...", "total_spending": ${totalSpending} }`;

  const response = await callDedalus({
    messages: [{ role: 'user', content: diaryPrompt }],
  });

  const text = extractText(response);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {
      diary_text: text,
      spending_insight: '',
      tomorrow_suggestion: '',
      total_spending: totalSpending,
    };
  }

  // Save to Supabase via FastAPI backend
  const today = new Date().toISOString().split('T')[0];
  const saveRes = await fetch(`${BACKEND_URL}/api/diary/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: today,
      diary: { ...parsed, timeline },
    }),
  });
  const saved = await saveRes.json();

  return NextResponse.json(saved);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '30';

  const res = await fetch(`${BACKEND_URL}/api/diary/history?limit=${limit}`);
  const data = await res.json();
  return NextResponse.json(data);
}
