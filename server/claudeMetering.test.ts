import { afterEach, beforeEach, expect, it, vi } from "vitest";
const { create, stream, finalMessage, recordUsage } = vi.hoisted(() => ({ create: vi.fn(), stream: vi.fn(), finalMessage: vi.fn(), recordUsage: vi.fn() }));
vi.mock("./aiMetering", () => ({ recordUsage }));
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    static RateLimitError = class extends Error {};
    static AuthenticationError = class extends Error {};
    static APIError = class extends Error {};
    beta = { messages: { create, stream } };
  }
  return { default: MockAnthropic };
});
import { ask } from "./claude";
const message = (stop_reason: string) => ({ model: "returned-model", stop_reason, content: [{ type: "text", text: "answer" }], usage: { input_tokens: 12, output_tokens: 5 } });
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("CLAUDE_API_KEY", "test-key"); stream.mockReturnValue({ finalMessage }); });
afterEach(() => vi.unstubAllEnvs());
it("records every pause-turn response before continuing", async () => {
  const first = message("pause_turn"), last = message("end_turn");
  create.mockResolvedValueOnce(first).mockResolvedValueOnce(last);
  await ask({ system: "test", messages: [] });
  expect(recordUsage.mock.calls.map(([r]) => r)).toEqual([first, last]);
});
it("records the final streaming message", async () => {
  const result = message("end_turn"); finalMessage.mockResolvedValueOnce(result);
  await ask({ system: "test", messages: [], maxTokens: 32000 });
  expect(recordUsage).toHaveBeenCalledWith(result, undefined); expect(create).not.toHaveBeenCalled();
});
it("records paid refusals before raising the existing error", async () => {
  create.mockResolvedValueOnce(message("refusal"));
  await expect(ask({ system: "test", messages: [] })).rejects.toThrow("declined");
  expect(recordUsage).toHaveBeenCalledOnce();
});
