import { afterEach, describe, expect, it, vi } from "vitest";
import { aiContext, extractUsage, recordUsage } from "./aiMetering";
import { DEFAULT_AI_PRICES, estimateCost, priceSchema } from "../shared/aiPricing";

const { insert, values } = vi.hoisted(() => ({ insert: vi.fn(), values: vi.fn() }));
vi.mock("./db", () => ({ db: { insert }, schema: { aiTokenUsage: {} }, newId: () => "id" }));
afterEach(() => { vi.restoreAllMocks(); values.mockReset(); insert.mockReset(); });
const response = { model: "claude-opus-5-5", usage: { input_tokens: 100, output_tokens: 200, cache_creation_input_tokens: 300, cache_read_input_tokens: 400, server_tool_use: { web_search_requests: 2, web_fetch_requests: 1 } } };
describe("Claude token metering", () => {
  it("extracts independent token buckets and all reported tool counters", () => {
    expect(extractUsage(response)).toEqual({ model: response.model, inputTokens: 100, outputTokens: 200, cacheCreationInputTokens: 300, cacheReadInputTokens: 400, serverToolUse: { web_search_requests: 2, web_fetch_requests: 1 }, rawUsage: response.usage });
  });
  it("handles missing optional counts and rejects invalid counts", () => {
    expect(extractUsage({ usage: { input_tokens: -1, output_tokens: Infinity, cache_read_input_tokens: null } })).toMatchObject({ inputTokens: 0, outputTokens: 0, cacheReadInputTokens: 0, cacheCreationInputTokens: 0, serverToolUse: {} });
  });
  it("isolates concurrent request attribution and supports explicit system attribution", async () => {
    insert.mockReturnValue({ values }); values.mockResolvedValue(undefined);
    const contexts = await Promise.all(["alice", "bob"].map((userId) => aiContext.run({ userId, feature: () => "/assistant" }, async () => { await Promise.resolve(); return aiContext.getStore()!; })));
    expect(contexts.map((c) => c.userId)).toEqual(["alice", "bob"]);
    // Persist sequentially: Vite's dynamic mock loader is not reentrant.
    for (const context of contexts) await aiContext.run(context, () => recordUsage(response));
    expect(values.mock.calls.map(([r]) => r.userId).sort()).toEqual(["alice", "bob"]);
    await aiContext.run({ userId: "alice", feature: "/news" }, () => recordUsage(response, { userId: null, feature: "news.refresh" }));
    expect(values).toHaveBeenLastCalledWith(expect.objectContaining({ userId: null, feature: "news.refresh" }));
  });
  it("logs persistence failures without rejecting the AI call", async () => {
    insert.mockReturnValue({ values }); values.mockRejectedValue(new Error("database unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(recordUsage(response)).resolves.toBeUndefined(); expect(log).toHaveBeenCalled();
  });
});
describe("estimated token cost", () => {
  it("charges each bucket once, including cache tokens", () => {
    expect(estimateCost(extractUsage(response), response.model, DEFAULT_AI_PRICES)).toBeCloseTo(0.00598, 10);
  });
  it("uses editable prices including zero and supports dated model identifiers", () => {
    const tokens = extractUsage(response);
    expect(estimateCost(tokens, "claude-haiku-4-5-20251001", DEFAULT_AI_PRICES)).toBeCloseTo(0.001515, 10);
    expect(estimateCost(tokens, "custom", { custom: { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 } })).toBe(0);
    expect(estimateCost(tokens, "unknown", DEFAULT_AI_PRICES)).toBeNull();
  });
  it("rejects negative and incomplete price settings", () => {
    expect(priceSchema.safeParse({ model: { input: -1 } }).success).toBe(false);
  });
});
