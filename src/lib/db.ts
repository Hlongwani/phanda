import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'phanda.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY,
      phone_number TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      pin_hash TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      merchant_id TEXT UNIQUE NOT NULL,
      trading_name TEXT NOT NULL,
      category TEXT DEFAULT 'general_retail',
      city TEXT DEFAULT '',
      province TEXT DEFAULT '',
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      type TEXT DEFAULT 'sale',
      channel TEXT DEFAULT 'app',
      payment_method TEXT DEFAULT 'cash',
      amount REAL NOT NULL,
      description TEXT,
      category_tag TEXT,
      trust_level TEXT DEFAULT 'self_recorded',
      transaction_date TEXT DEFAULT (datetime('now')),
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS otps (
      id TEXT PRIMARY KEY,
      phone_number TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS passport_shares (
      token TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS laybys (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      item_description TEXT NOT NULL,
      total_price REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS layby_payments (
      id TEXT PRIMARY KEY,
      layby_id TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      paid_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (layby_id) REFERENCES laybys(id)
    );

    CREATE TABLE IF NOT EXISTS credit_accounts (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      party_name TEXT NOT NULL,
      party_phone TEXT,
      description TEXT NOT NULL,
      total_amount REAL NOT NULL,
      amount_settled REAL DEFAULT 0,
      status TEXT DEFAULT 'open',
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS credit_payments (
      id TEXT PRIMARY KEY,
      credit_id TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      paid_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (credit_id) REFERENCES credit_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS passports (
      id TEXT PRIMARY KEY,
      merchant_id TEXT UNIQUE NOT NULL,
      business_id TEXT UNIQUE NOT NULL,
      passport_number TEXT UNIQUE NOT NULL,
      health_score INTEGER DEFAULT 0,
      total_revenue_30d REAL DEFAULT 0,
      total_revenue_90d REAL DEFAULT 0,
      total_revenue_365d REAL DEFAULT 0,
      transaction_count_30d INTEGER DEFAULT 0,
      avg_daily_revenue REAL DEFAULT 0,
      pct_cash REAL DEFAULT 100,
      pct_digital REAL DEFAULT 0,
      consistency_score INTEGER DEFAULT 0,
      volume_score INTEGER DEFAULT 0,
      longevity_score INTEGER DEFAULT 0,
      verification_level TEXT DEFAULT 'self_recorded',
      operating_days INTEGER DEFAULT 0,
      generated_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id),
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );
  `);
}
