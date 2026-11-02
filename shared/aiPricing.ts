import { z } from "zod";

export const priceSchema = z.record(z.string().min(1).max(120), z.object({
  input: z.number().finite().min(0), output: z.number().finite().min(0),
  cacheWrite: z.number().finite().min(0), cacheRead: z.number().finite().min(0),
}));
export type Prices = z.infer<typeof priceSchema>;
// Standard USD / million tokens; cache writes use the wrapper's default five-minute TTL.
// https://platform.claude.com/docs/en/about-claude/pricing
export const DEFAULT_AI_PRICES: Prices = {
  "claude-opus-5-5": { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.1 },
  "claude-fable-5-1": { input: 10, output: 50, cacheWrite: 12.5, cacheRead: 0.25 },
  // Baseline tier (prompts <= 100k); administrators can override for their workload.
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 },
  "claude-opus-4-6": { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
  "claude-sonnet-4-6": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
};
export interface TokenCounts { inputTokens: number; outputTokens: number; cacheCreationInputTokens: number; cacheReadInputTokens: number }
export function estimateCost(tokens: TokenCounts, model: string, prices: Prices): number | null {
  const key = Object.keys(prices).find((k) => k === model) ?? Object.keys(prices).find((k) => model.replace(/-\d{8}$/, "") === k);
  if (!key) return null; // Never present an unknown model as free.
  const p = prices[key];
  return (tokens.inputTokens * p.input + tokens.outputTokens * p.output + tokens.cacheCreationInputTokens * p.cacheWrite + tokens.cacheReadInputTokens * p.cacheRead) / 1e6;
}
