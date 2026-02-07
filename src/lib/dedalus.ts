import { AsyncDedalus, DedalusRunner } from 'dedalus-labs';

export const dedalusClient = new AsyncDedalus({
  apiKey: process.env.DEDALUS_API_KEY,
});

export const runner = new DedalusRunner(dedalusClient);
