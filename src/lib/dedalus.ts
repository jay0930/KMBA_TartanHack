import { Dedalus, DedalusRunner } from 'dedalus-labs';

export type { RunResult } from 'dedalus-labs/lib/runner/runner';

export const dedalusClient = new Dedalus({
  apiKey: process.env.DEDALUS_API_KEY,
});

export const runner = new DedalusRunner(dedalusClient);
