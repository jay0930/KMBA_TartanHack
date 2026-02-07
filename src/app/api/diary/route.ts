import { NextResponse } from 'next/server';
import { callDedalus, extractText } from '@/lib/dedalus';
import type { TimelineEvent } from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export async function POST(request: Request) {
  const { timeline }: { timeline: TimelineEvent[] } = await request.json();

  const totalSpending = timeline.reduce((sum, item) => sum + (item.spending || 0), 0);

  const diaryPrompt = `Here is the user's timeline for today:
${JSON.stringify(timeline, null, 2)}

Total spending: $${totalSpending.toFixed(2)}

Based on this timeline:
1. Write a warm, personal diary entry (150-250 words). Write in the SAME language as the user's timeline events above. If the events are in English, write in English. If in Korean, write in Korean. Match the user's language.
2. Pick a single "primary_emoji" that best represents today's overall mood/theme
3. Create an "emojis" array — one emoji per timeline event that captures each moment (in chronological order)
4. Write a one-sentence spending insight
5. Write a one-sentence positive suggestion for tomorrow

Return ONLY a JSON object (no markdown, no code fences):
{
  "diary_text": "...",
  "primary_emoji": "☕",
  "emojis": ["☕", "🍜", "📚", "🍕"],
  "spending_insight": "...",
  "tomorrow_suggestion": "...",
  "total_spending": ${totalSpending},
  "diary_preview": "first 100 chars of diary_text..."
}`;

  const response = await callDedalus({
    messages: [{ role: 'user', content: diaryPrompt }],
  });

  let text = extractText(response).trim();
  // Strip markdown code fences if present
  if (text.startsWith('```')) {
    text = text.split('\n').slice(1).join('\n').replace(/```\s*$/, '').trim();
  }
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

  // Ensure primary_emoji and diary_preview exist
  if (!parsed.primary_emoji) {
    parsed.primary_emoji = timeline[0]?.emoji || '📝';
  }
  if (!parsed.diary_preview) {
    parsed.diary_preview = (parsed.diary_text || '').slice(0, 100);
  }
  if (!parsed.emojis || !Array.isArray(parsed.emojis)) {
    parsed.emojis = timeline.map((e: TimelineEvent) => e.emoji || '📝');
  }

  // Save to Supabase via FastAPI backend
  const today = new Date().toISOString().split('T')[0];
  const saveRes = await fetch(`${BACKEND_URL}/api/diary/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: today,
      diary: {
        ...parsed,
        timeline: timeline.map((e, i) => ({
          ...e,
          emoji: parsed.emojis?.[i] || e.emoji || '📝',
        })),
      },
    }),
  });
  const saved = await saveRes.json();

  // Attach emojis to the response for frontend
  saved.emojis = parsed.emojis;

  return NextResponse.json(saved);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '30';

  const res = await fetch(`${BACKEND_URL}/api/diary/history?limit=${limit}`);
  const data = await res.json();
  return NextResponse.json(data);
}
