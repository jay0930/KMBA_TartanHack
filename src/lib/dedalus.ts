import { Dedalus, DedalusRunner } from 'dedalus-labs';

export type { RunResult } from 'dedalus-labs/lib/runner/runner';

export const dedalusClient = new Dedalus({
  apiKey: process.env.DEDALUS_API_KEY,
});

export const runner = new DedalusRunner(dedalusClient);

// ── Raw OpenAI-compatible API helpers ───────────────────────────────

interface DedalusMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | any[];
  tool_call_id?: string;
}

interface DedalusTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

interface CallDedalusOptions {
  messages: DedalusMessage[];
  model?: string;
  tools?: DedalusTool[];
  max_tokens?: number;
}

export async function callDedalus(options: CallDedalusOptions) {
  const apiKey = process.env.DEDALUS_API_KEY;
  if (!apiKey) throw new Error('DEDALUS_API_KEY not set');

  const body: any = {
    model: options.model || 'anthropic/claude-sonnet-4-5-20250929',
    messages: options.messages,
    max_tokens: options.max_tokens || 2000,
  };

  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools;
  }

  const start = Date.now();
  console.log(`[Dedalus] → ${body.model} (${body.messages.length} msgs)`);

  const response = await fetch('https://api.dedaluslabs.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const elapsed = Date.now() - start;

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Dedalus] ✗ ${response.status} (${elapsed}ms)`, errorText);
    throw new Error(`Dedalus API error ${response.status}: ${errorText}`);
  }

  console.log(`[Dedalus] ✓ ${response.status} (${elapsed}ms)`);
  return response.json();
}

export function extractText(response: any): string {
  return response?.choices?.[0]?.message?.content || '';
}

export function extractToolCalls(response: any): any[] {
  return response?.choices?.[0]?.message?.tool_calls || [];
}
