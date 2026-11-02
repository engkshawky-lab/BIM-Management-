import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestHandler } from "express";

export interface UsageContext { userId: string | null; feature: string | (() => string) }
export const aiContext = new AsyncLocalStorage<UsageContext>();
export const aiUsageContext: RequestHandler = (req, _res, next) => {
  aiContext.run({ userId: req.user?.id ?? null, feature: () => `${req.method} ${req.baseUrl}${req.route?.path ?? req.path}` }, next);
};
const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === "object" ? v as Record<string, unknown> : {};
const count = (v: unknown) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : 0;
export function extractUsage(response: unknown) {
  const r = object(response), u = object(r.usage);
  return {
    model: String(r.model ?? "unknown"), inputTokens: count(u.input_tokens), outputTokens: count(u.output_tokens),
    cacheCreationInputTokens: count(u.cache_creation_input_tokens), cacheReadInputTokens: count(u.cache_read_input_tokens),
    serverToolUse: Object.fromEntries(Object.entries(object(u.server_tool_use)).filter(([, v]) => typeof v === "number").map(([k, v]) => [k, count(v)])),
    rawUsage: u,
  };
}
/** Metering is deliberately best effort: a database outage must not discard a paid AI answer. */
export async function recordUsage(response: unknown, explicit?: UsageContext) {
  try {
    const context = explicit ?? aiContext.getStore();
    const { db, schema, newId } = await import("./db");
    await db.insert(schema.aiTokenUsage).values({
      id: newId(), userId: context?.userId ?? null,
      feature: (typeof context?.feature === "function" ? context.feature() : context?.feature ?? "system").slice(0, 255),
      ...extractUsage(response), createdAt: new Date(),
    });
  } catch (e) { console.error("[ai-usage] Failed to record Claude usage", e); }
}
