import { runner } from '@/lib/dedalus';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { message, context } = await request.json();

  const response = await runner.run({
    input: message,
    model: "anthropic/claude-sonnet-4-5-20250929",
  });

  return NextResponse.json({ reply: response.final_output });
}
