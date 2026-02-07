import { runner, type RunResult } from '@/lib/dedalus';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const response = await runner.run({
    input: `${date}에 찍은 사진들의 메타데이터(시간, 위치, 썸네일 URL)를 가져와줘`,
    model: "anthropic/claude-sonnet-4-5-20250929",
    mcpServers: ["google-photos"],
  }) as RunResult;

  return NextResponse.json({ photos: response.finalOutput });
}
