import "dotenv/config";
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { createDb, normalizeEmail } from "./db.js";

const {
  PORT = "8787",
  SQLITE_PATH = "./data/app.db",
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  DEFAULT_GRANT_ID = "sombraenelespejo-libro-completo",
  ALLOWED_ORIGINS = "",
} = process.env;

const app = express();
const db = createDb(SQLITE_PATH);

const allowedOrigins = ALLOWED_ORIGINS
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origen no permitido por CORS."));
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "sombraenelespejo-backend" });
});

app.get("/api/access/verify", express.json(), (req, res) => {
  const email = normalizeEmail(req.query.email);
  const grantId = String(req.query.grantId || DEFAULT_GRANT_ID).trim();

  if (!email || !grantId) {
    res.status(400).json({ ok: false, error: "email y grantId son obligatorios." });
    return;
  }

  const row = db
    .prepare(
      `SELECT active, updated_at
       FROM entitlements
       WHERE email = ? AND grant_id = ?
       LIMIT 1`,
    )
    .get(email, grantId);

  res.json({
    ok: true,
    hasAccess: Boolean(row && row.active === 1),
    updatedAt: row?.updated_at || null,
  });
});

if (STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET) {
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    (req, res) => {
      const signature = req.headers["stripe-signature"];

      if (!signature) {
        res.status(400).send("Falta stripe-signature");
        return;
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          STRIPE_WEBHOOK_SECRET,
        );
      } catch (error) {
        res.status(400).send(`Webhook inválido: ${error.message}`);
        return;
      }

      if (event.type !== "checkout.session.completed") {
        res.json({ received: true, ignored: true, eventType: event.type });
        return;
      }

      const session = event.data.object;
      const email = normalizeEmail(
        session.customer_details?.email || session.customer_email,
      );
      const grantId = String(session.metadata?.grantId || DEFAULT_GRANT_ID).trim();

      if (!email || !grantId) {
        res.status(400).json({ received: false, error: "No se pudo derivar email/grantId." });
        return;
      }

      const nowIso = new Date().toISOString();

      const insertPurchase = db.prepare(`
        INSERT OR IGNORE INTO purchases (
          stripe_session_id,
          stripe_payment_intent_id,
          stripe_customer_id,
          email,
          grant_id,
          amount_total,
          currency,
          status,
          event_id,
          raw_payload,
          purchased_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const upsertEntitlement = db.prepare(`
        INSERT INTO entitlements (email, grant_id, active, source, updated_at)
        VALUES (?, ?, 1, 'stripe_webhook', ?)
        ON CONFLICT(email, grant_id)
        DO UPDATE SET
          active = 1,
          source = 'stripe_webhook',
          updated_at = excluded.updated_at
      `);

      const transaction = db.transaction(() => {
        insertPurchase.run(
          String(session.id || ""),
          String(session.payment_intent || ""),
          String(session.customer || ""),
          email,
          grantId,
          Number.isInteger(session.amount_total) ? session.amount_total : null,
          String(session.currency || "").toUpperCase(),
          String(session.payment_status || "paid"),
          String(event.id || ""),
          JSON.stringify(session),
          nowIso,
        );

        upsertEntitlement.run(email, grantId, nowIso);
      });

      try {
        transaction();
        res.json({ received: true, granted: true, email, grantId });
      } catch (error) {
        res.status(500).json({ received: false, error: error.message });
      }
    },
  );
} else {
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), (_req, res) => {
    res.status(503).json({
      received: false,
      error: "Faltan STRIPE_SECRET_KEY y/o STRIPE_WEBHOOK_SECRET en entorno.",
    });
  });
}

app.use(express.json());

app.listen(Number(PORT), () => {
  // Salida intencional para logs operativos de despliegue.
  console.log(`Backend listo en http://localhost:${PORT}`);
});
