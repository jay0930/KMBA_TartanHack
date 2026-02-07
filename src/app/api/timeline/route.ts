import { runner, type RunResult } from '@/lib/dedalus';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { events, photos } = await request.json();

  const response = await runner.run({
    input: `다음 캘린더 일정과 사진 데이터를 시간순으로 정리해서 타임라인을 만들어줘.

캘린더 일정: ${JSON.stringify(events)}
사진 데이터: ${JSON.stringify(photos)}

JSON 배열 형태로 반환: [{ "time": "HH:MM", "event": "설명", "photoUrl": "url 또는 null" }]`,
    model: "anthropic/claude-sonnet-4-5-20250929",
  }) as RunResult;

  return NextResponse.json({ timeline: response.finalOutput });
}
