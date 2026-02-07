import { runner, type RunResult } from '@/lib/dedalus';
import { NextResponse } from 'next/server';
import type { TimelineEvent } from '@/lib/types';

export async function POST(request: Request) {
  const { timeline }: { timeline: TimelineEvent[] } = await request.json();

  const totalExpense = timeline.reduce((sum, item) => sum + item.expense, 0);

  const diaryPrompt = `
    다음은 사용자의 오늘 하루 타임라인입니다:
    ${JSON.stringify(timeline, null, 2)}

    총 지출: ${totalExpense}원

    이 정보를 바탕으로:
    1. 따뜻하고 개인적인 일기를 한국어로 작성해주세요 (200-300자)
    2. 내일을 위한 한 줄 제안을 해주세요

    JSON 형태로 반환: { "diary": "...", "tomorrowSuggestion": "..." }
  `;

  const response = await runner.run({
    input: diaryPrompt,
    model: "anthropic/claude-sonnet-4-5-20250929",
  }) as RunResult;

  return NextResponse.json(JSON.parse(response.finalOutput));
}
