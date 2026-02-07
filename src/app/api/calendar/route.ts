import { runner } from '@/lib/dedalus';
import { NextResponse } from 'next/server';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  const response = await runner.run({
    input: `오늘(${today}) 캘린더의 모든 일정을 시간순으로 가져와줘. JSON 형태로 반환해줘.`,
    model: "anthropic/claude-sonnet-4-5-20250929",
    mcp_servers: ["google-calendar"],
  });

  return NextResponse.json({ events: response.final_output });
}
