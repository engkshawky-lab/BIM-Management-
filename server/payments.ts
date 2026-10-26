import { eq } from "drizzle-orm";
import express, { Router } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { db, schema } from "./db";
import { publicUrl } from "./mailer";
import { h, parse } from "./routes/auth";

// Card payments through Stripe Checkout and the Stripe customer portal. Plans are kept in sync
// by signed webhooks; nothing changes on a redirect alone.
const PRICES: Record<string, string | undefined> = { pro: process.env.STRIPE_PRICE_PRO, enterprise: process.env.STRIPE_PRICE_ENTERPRISE };
export const paymentsEnabled = () => !!process.env.STRIPE_SECRET_KEY && !!(PRICES.pro || PRICES.enterprise);

let client: Stripe | null = null;
const stripe = () => (client ??= new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // STRIPE_API_HOST lets the test suite point at a local stand-in; production uses Stripe's default host
  ...(process.env.STRIPE_API_HOST ? { host: process.env.STRIPE_API_HOST, port: Number(process.env.STRIPE_API_PORT ?? 443), protocol: (process.env.STRIPE_API_PROTOCOL ?? "https") as "http" | "https" } : {}),
}));
const planForPrice = (price?: string | null) => Object.entries(PRICES).find(([, id]) => id && id === price)?.[0] ?? null;

async function upsert(userId: string, set: Partial<typeof schema.subscriptions.$inferInsert>) {
  const row = { plan: "free", status: "active", source: "stripe", ...set, updatedAt: new Date() };
  await db.insert(schema.subscriptions).values({ userId, ...row }).onDuplicateKeyUpdate({ set: { ...set, source: "stripe", updatedAt: new Date() } });
}

export const paymentsRouter = Router();

paymentsRouter.get("/billing/payments", (_req, res) => res.json({ enabled: paymentsEnabled(), plans: Object.entries(PRICES).filter(([, v]) => v).map(([k]) => k) }));

paymentsRouter.post("/billing/checkout", h(async (req, res) => {
  if (!paymentsEnabled()) return res.status(400).json({ error: "Online payments are not configured on this installation." });
  const body = parse(z.object({ plan: z.enum(["pro", "enterprise"]) }), req.body, res); if (!body) return;
  const price = PRICES[body.plan]; if (!price) return res.status(400).json({ error: "That plan is not sold online. Contact your administrator." });
  const [sub] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, req.user!.id));
  const base = publicUrl(`${req.protocol}://${req.get("host")}`);
  const session = await stripe().checkout.sessions.create({
    mode: "subscription", line_items: [{ price, quantity: 1 }], client_reference_id: req.user!.id,
    ...(sub?.stripeCustomerId ? { customer: sub.stripeCustomerId } : { customer_email: req.user!.email }),
    metadata: { userId: req.user!.id, plan: body.plan }, subscription_data: { metadata: { userId: req.user!.id, plan: body.plan } },
    success_url: `${base}/#/billing/paid`, cancel_url: `${base}/#/billing`,
  });
  res.json({ url: session.url });
}));

paymentsRouter.post("/billing/portal", h(async (req, res) => {
  if (!paymentsEnabled()) return res.status(400).json({ error: "Online payments are not configured on this installation." });
  const [sub] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, req.user!.id));
  if (!sub?.stripeCustomerId) return res.status(400).json({ error: "No online subscription found for your account." });
  const session = await stripe().billingPortal.sessions.create({ customer: sub.stripeCustomerId, return_url: `${publicUrl(`${req.protocol}://${req.get("host")}`)}/#/billing` });
  res.json({ url: session.url });
}));

/** Stripe webhook: must receive the raw body to verify the signature. Mounted before express.json(). */
export const stripeWebhook = [express.raw({ type: "application/json", limit: "1mb" }), async (req: express.Request, res: express.Response) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!paymentsEnabled() || !secret) return res.status(404).end();
  let event: Stripe.Event;
  try { event = stripe().webhooks.constructEvent(req.body as Buffer, String(req.headers["stripe-signature"] ?? ""), secret); }
  catch { return res.status(400).json({ error: "Invalid signature." }); }
  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.metadata?.userId ?? s.client_reference_id;
      if (userId) await upsert(userId, { plan: s.metadata?.plan ?? "pro", status: "active", renewsAt: null, stripeCustomerId: String(s.customer ?? ""), stripeSubscriptionId: String(s.subscription ?? "") });
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        const plan = planForPrice(sub.items?.data?.[0]?.price?.id) ?? sub.metadata?.plan ?? "pro";
        const active = event.type !== "customer.subscription.deleted" && ["active", "trialing"].includes(sub.status);
        await upsert(userId, { plan: active ? plan : "free", status: active ? "active" : sub.status === "past_due" ? "past_due" : "cancelled", stripeSubscriptionId: sub.id });
      }
    } else if (event.type === "invoice.payment_failed") {
      const inv = event.data.object as Stripe.Invoice;
      const [row] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.stripeCustomerId, String(inv.customer ?? "")));
      if (row) await upsert(row.userId, { status: "past_due" });
    }
    res.json({ received: true });
  } catch (e) { console.error("[stripe webhook]", e); res.status(500).end(); }
}] as const;
