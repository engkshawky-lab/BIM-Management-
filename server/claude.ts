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
      msg = await getClient().beta.messages.create({
        model: MODEL,
        max_tokens: opts.maxTokens ?? 16000,
        system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
        messages,
        output_config: { effort: opts.effort ?? "medium" },
        ...(opts.tools ? { tools: opts.tools as Anthropic.Beta.BetaToolUnion[] } : {}),
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
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

/** Parse a JSON object from a model answer (tolerates code fences). */
export function parseJson<T>(text: string): T {
  const t = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = t.indexOf("{"), end = t.lastIndexOf("}");
  return JSON.parse(start >= 0 && end > start ? t.slice(start, end + 1) : t) as T;
}
