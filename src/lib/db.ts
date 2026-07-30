import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// Serverless platforms (Vercel, etc.) ship a read-only deployment bundle —
// only /tmp is writable there. Locally, keep using ./data so the DB persists
// across restarts.
const dataDir = process.env.VERCEL
  ? path.join("/tmp", "book-log-data")
  : path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const globalForDb = globalThis as unknown as { __bookLogDb?: Database.Database };

const db =
  globalForDb.__bookLogDb ??
  new Database(path.join(dataDir, "book-log.db"));

if (process.env.NODE_ENV !== "production") {
  globalForDb.__bookLogDb = db;
}

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT,
    genre TEXT,
    cover_url TEXT,
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (book_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS reading_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('read', 'skipped')),
    book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
    custom_title TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, log_date)
  );

  CREATE TABLE IF NOT EXISTS aladin_search_cache (
    isbn TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    publisher TEXT,
    cover TEXT,
    description TEXT,
    link TEXT,
    cached_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_reading_logs_user_date ON reading_logs(user_id, log_date);
  CREATE INDEX IF NOT EXISTS idx_aladin_cache_title ON aladin_search_cache(title);
`);

const reviewColumns = db.prepare("PRAGMA table_info(reviews)").all() as {
  name: string;
}[];
if (!reviewColumns.some((c) => c.name === "is_public")) {
  db.exec("ALTER TABLE reviews ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1");
}

const bookColumns = db.prepare("PRAGMA table_info(books)").all() as {
  name: string;
}[];
if (!bookColumns.some((c) => c.name === "purchase_url")) {
  db.exec("ALTER TABLE books ADD COLUMN purchase_url TEXT");
}
if (!bookColumns.some((c) => c.name === "isbn")) {
  db.exec("ALTER TABLE books ADD COLUMN isbn TEXT");
}

export default db;
