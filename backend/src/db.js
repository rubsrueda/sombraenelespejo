import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

function ensureDir(filePath) {
  const absolute = path.resolve(filePath);
  const dir = path.dirname(absolute);
  fs.mkdirSync(dir, { recursive: true });
  return absolute;
}

export function createDb(sqlitePath) {
  const dbPath = ensureDir(sqlitePath);
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stripe_session_id TEXT UNIQUE,
      stripe_payment_intent_id TEXT,
      stripe_customer_id TEXT,
      email TEXT NOT NULL,
      grant_id TEXT NOT NULL,
      amount_total INTEGER,
      currency TEXT,
      status TEXT NOT NULL,
      event_id TEXT UNIQUE,
      raw_payload TEXT,
      purchased_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_purchases_email_grant
      ON purchases (email, grant_id);

    CREATE TABLE IF NOT EXISTS entitlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      grant_id TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      source TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (email, grant_id)
    );
  `);

  return db;
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}
