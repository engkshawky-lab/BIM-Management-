// Startup checks for a production install. Problems that make the portal unsafe stop it from starting;
// settings that are risky but survivable are logged as warnings (see docs/LAUNCH.md).

type Env = Record<string, string | undefined>;
export interface Preflight { errors: string[]; warnings: string[] }

/** Values shipped in .env.example / docker-compose.yml: anyone could forge sessions with them. */
const PLACEHOLDER = /change-?me|example|placeholder|your[-_ ]?secret/i;

export function sessionSecretProblem(secret: string | undefined): string | null {
  const s = secret ?? "";
  if (s.length < 32) return "SESSION_SECRET must contain at least 32 characters.";
  if (PLACEHOLDER.test(s)) return "SESSION_SECRET is still the example value. Generate one with: openssl rand -base64 48";
  if (new Set(s).size < 10) return "SESSION_SECRET is too predictable (too few different characters). Generate one with: openssl rand -base64 48";
  return null;
}

export function preflight(env: Env): Preflight {
  const errors: string[] = []; const warnings: string[] = [];
  const secret = sessionSecretProblem(env.SESSION_SECRET);
  if (secret) errors.push(secret);
  if (env.NODE_ENV !== "production") return { errors, warnings };

  const dbPassword = /^mysql:\/\/[^:]+:([^@]*)@/.exec(env.DATABASE_URL ?? "")?.[1] ?? "";
  if (!dbPassword || PLACEHOLDER.test(dbPassword) || ["portal", "password", "root"].includes(dbPassword)) warnings.push("The database password is a default value. Set DB_PASSWORD and DB_ROOT_PASSWORD to strong random values.");
  if (!env.PUBLIC_URL) warnings.push("PUBLIC_URL is not set: email links, robots.txt and the sitemap fall back to the request address.");
  else if (!env.PUBLIC_URL.startsWith("https://")) warnings.push("PUBLIC_URL does not use https://. Serve the portal over HTTPS only.");
  if (env.COOKIE_SECURE !== "true") warnings.push("COOKIE_SECURE is not true. Set it once the portal is served only over HTTPS.");
  if (env.CLAUDE_API_KEY && env.BILLING !== "on" && !Number(env.AI_MONTHLY_LIMIT)) warnings.push("AI is enabled without a monthly cap: set BILLING=on or AI_MONTHLY_LIMIT, and a spend limit in the Anthropic console.");
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_WEBHOOK_SECRET) warnings.push("STRIPE_SECRET_KEY is set without STRIPE_WEBHOOK_SECRET: paid subscriptions will not activate.");
  if (env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) warnings.push("Stripe is in test mode (sk_test_ key).");
  return { errors, warnings };
}

/** Log warnings; stop the process on errors. */
export function runPreflight(env: Env = process.env) {
  const { errors, warnings } = preflight(env);
  for (const w of warnings) console.warn(`[preflight] warning: ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`[preflight] ${e}`);
    process.exit(1);
  }
}
