import Anthropic from "@anthropic-ai/sdk";

// One place for Claude calls: model choice, refusal fallback and response checks.
export const MODEL = process.env.CLAUDE_MODEL?.trim() || "claude-opus-5-5";
export const apiKey = () => process.env.CLAUDE_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim();

export class AiError extends Error { constructor(message: string, public status: number) { super(message); } }

let client: Anthropic | null = null;
const getClient = () => {
  const key = apiKey();
  if (!key) throw new AiError("AI is not configured. Set CLAUDE_API_KEY on the server.", 503);
  return (client ??= new Anthropic({ apiKey: key }));
};

/**
 * Ask Claude and return the text answer. Uses the server-side refusal fallback (routed by
 * refusal category) so a policy decline is retried on a suitable model within the same call.
 */
export async function ask(opts: { system: string; messages: Anthropic.Beta.BetaMessageParam[]; maxTokens?: number; effort?: "low" | "medium" | "high"; tools?: unknown[] }) {
  try {
    const messages = [...opts.messages];
    let msg;
    // Server tools (e.g. web search) can pause a long turn; continue it a few times before giving up.
    for (let i = 0; i < 4; i++) {
      const params = {
        model: MODEL,
        max_tokens: opts.maxTokens ?? 16000,
        system: [{ type: "text" as const, text: opts.system, cache_control: { type: "ephemeral" as const } }],
        messages,
        output_config: { effort: opts.effort ?? "medium" },
        ...(opts.tools ? { tools: opts.tools as Anthropic.Beta.BetaToolUnion[] } : {}),
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      } as Anthropic.Beta.MessageCreateParamsNonStreaming;
      // the SDK refuses large non-streaming requests (they may run past its timeout), so stream those and keep the final message
      msg = params.max_tokens > 16000
        ? await getClient().beta.messages.stream(params).finalMessage()
        : await getClient().beta.messages.create(params);
      if (msg.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: msg.content as Anthropic.Beta.BetaContentBlockParam[] });
    }
    msg = msg!;
    if (msg.stop_reason === "refusal") throw new AiError("The AI model declined this request.", 422);
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    if (!text) throw new AiError("The AI returned no answer. Try rephrasing.", 502);
    return { text, truncated: msg.stop_reason === "max_tokens" };
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.RateLimitError) throw new AiError("The AI service is busy. Try again in a minute.", 429);
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("The AI API key is invalid.", 503);
    if (e instanceof Anthropic.APIError) throw new AiError(`AI request failed (${e.status ?? "network"}).`, 502);
    throw e;
  }
}

/** Parse a JSON object from a model answer (tolerates code fences, and an answer cut off by the length limit). */
export function parseJson<T>(text: string): T {
  const t = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = t.indexOf("{"), end = t.lastIndexOf("}");
  try { return JSON.parse(start >= 0 && end > start ? t.slice(start, end + 1) : t) as T; }
  catch (e) { const fixed = start >= 0 ? closeTruncatedJson(t.slice(start)) : null; if (fixed) return fixed as T; throw e; }
}

/** Salvage a JSON object that was cut off mid-way: drop the incomplete tail and close open arrays/objects. */
export function closeTruncatedJson(t: string): unknown | null {
  // candidate cut points: just after each complete value inside a container (after "}" or "]" or a closed string)
  for (let cut = t.length; cut > 1; ) {
    cut = Math.max(t.lastIndexOf("}", cut - 1), t.lastIndexOf("]", cut - 1)) + 1;
    if (cut <= 0) break;
    const head = t.slice(0, cut);
    const stack: string[] = []; let inStr = false, esc = false;
    for (const ch of head) {
      if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true; else if (ch === "{" || ch === "[") stack.push(ch); else if (ch === "}" || ch === "]") stack.pop();
    }
    if (inStr) continue;
    try { return JSON.parse(head.replace(/,\s*$/, "") + stack.reverse().map((c) => (c === "{" ? "}" : "]")).join("")); } catch { /* try an earlier cut */ }
  }
  return null;
}
