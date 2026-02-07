import { runner, type RunResult } from '@/lib/dedalus';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { message } = await request.json();

  const response = await runner.run({
    input: message,
    model: "anthropic/claude-sonnet-4-5-20250929",
  }) as RunResult;

  return NextResponse.json({ reply: response.finalOutput });
}
