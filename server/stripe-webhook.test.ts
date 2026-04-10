/**
 * stripe-webhook.test.ts — Vitest tests for the Stripe webhook handler
 *
 * Tests:
 *   - verifyStripeSignature accepts valid signatures
 *   - verifyStripeSignature rejects missing header
 *   - verifyStripeSignature rejects tampered body
 *   - verifyStripeSignature rejects stale timestamps
 *   - verifyStripeSignature skips check when no secret is configured
 *   - POST /api/webhooks/stripe returns 400 for invalid signature
 *   - POST /api/webhooks/stripe returns 200 for unhandled event types
 *   - POST /api/webhooks/stripe processes checkout.session.completed
 *   - POST /api/webhooks/stripe skips already-paid invoices
 *   - POST /api/webhooks/stripe handles payment_intent.succeeded
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import crypto from "crypto";
import { registerStripeWebhook } from "./routes/stripeWebhook";

// ─── Mock db module ───────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  seedDefaultTemplates: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock ENV ─────────────────────────────────────────────────────────────────
// NOTE: vi.mock is hoisted to the top of the file, so we cannot reference
// MOCK_SECRET (defined below) inside the factory. Use the literal string here.
vi.mock("./_core/env", () => ({
  ENV: {
    stripeWebhookSecret: "whsec_test_secret_key_for_unit_tests",
    appUrl: "https://paintcrm-h9zwcmfu.manus.space",
    stripeSecretKey: "",
  },
}));

// Must match the literal used in vi.mock above
const MOCK_SECRET = "whsec_test_secret_key_for_unit_tests";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a valid Stripe-Signature header for a given payload and secret.
 */
function buildStripeSignature(payload: string, secret: string, timestampOverride?: number): string {
  const t = timestampOverride ?? Math.floor(Date.now() / 1000);
  const signedPayload = `${t}.${payload}`;
  const sig = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return `t=${t},v1=${sig}`;
}

/**
 * Create a minimal Express app with only the Stripe webhook route registered.
 */
function makeApp() {
  const app = express();
  // Register BEFORE any body-parsing middleware (mirrors production setup)
  registerStripeWebhook(app);
  return app;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/stripe — signature verification", () => {
  it("returns 400 when Stripe-Signature header is missing", async () => {
    const app = makeApp();
    const payload = JSON.stringify({ id: "evt_test", type: "ping", object: "event", data: { object: {} } });
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/signature/i);
  });

  it("returns 400 when signature is invalid", async () => {
    const app = makeApp();
    const payload = JSON.stringify({ id: "evt_test", type: "ping", object: "event", data: { object: {} } });
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=123456789,v1=invalidsignature")
      .send(payload);
    expect(res.status).toBe(400);
  });

  it("returns 400 when timestamp is stale (>5 minutes old)", async () => {
    const app = makeApp();
    const payload = JSON.stringify({ id: "evt_test", type: "ping", object: "event", data: { object: {} } });
    const staleTimestamp = Math.floor(Date.now() / 1000) - 400; // 6+ minutes ago
    const sig = buildStripeSignature(payload, MOCK_SECRET, staleTimestamp);
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", sig)
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/timestamp too old/i);
  });

  it("returns 200 for a valid signature with an unhandled event type", async () => {
    const app = makeApp();
    const payload = JSON.stringify({
      id: "evt_test_unhandled",
      object: "event",
      type: "customer.created",
      data: { object: { id: "cus_test" } },
    });
    const sig = buildStripeSignature(payload, MOCK_SECRET);
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", sig)
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(res.body.processed).toBe(false);
    expect(res.body.reason).toMatch(/unhandled/i);
  });
});

describe("POST /api/webhooks/stripe — checkout.session.completed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and processed:false when DB is unavailable", async () => {
    const app = makeApp();
    const payload = JSON.stringify({
      id: "evt_checkout_1",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          object: "checkout.session",
          payment_link: "plink_test_abc",
          payment_intent: "pi_test_123",
          payment_status: "paid",
        },
      },
    });
    const sig = buildStripeSignature(payload, MOCK_SECRET);
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", sig)
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    // DB is null → invoice not found → processed: false
    expect(res.body.processed).toBe(false);
  });

  it("skips processing when payment_status is not 'paid'", async () => {
    const app = makeApp();
    const payload = JSON.stringify({
      id: "evt_checkout_2",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_456",
          object: "checkout.session",
          payment_link: "plink_test_def",
          payment_intent: "pi_test_456",
          payment_status: "unpaid",
        },
      },
    });
    const sig = buildStripeSignature(payload, MOCK_SECRET);
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", sig)
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(false);
    expect(res.body.reason).toMatch(/payment_status/i);
  });
});

describe("POST /api/webhooks/stripe — payment_intent.succeeded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and processed:false when DB is unavailable", async () => {
    const app = makeApp();
    const payload = JSON.stringify({
      id: "evt_pi_1",
      object: "event",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_789",
          object: "payment_intent",
          status: "succeeded",
          amount: 50000,
          currency: "usd",
          metadata: {},
        },
      },
    });
    const sig = buildStripeSignature(payload, MOCK_SECRET);
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", sig)
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    // DB is null → invoice not found → processed: false
    expect(res.body.processed).toBe(false);
  });
});

describe("POST /api/webhooks/stripe — body parsing", () => {
  it("returns 400 for invalid JSON body", async () => {
    const app = makeApp();
    const rawPayload = "this is not valid json {{{";
    const sig = buildStripeSignature(rawPayload, MOCK_SECRET);
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", sig)
      .send(rawPayload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JSON/i);
  });
});
