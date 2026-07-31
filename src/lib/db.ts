import { createClient, type Client, type ResultSet } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error(
    "TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 환경변수가 설정되지 않았습니다."
  );
}

const globalForDb = globalThis as unknown as {
  __bookLogDb?: Client;
  __bookLogDbInit?: Promise<void>;
};

function getClient(): Client {
  if (!globalForDb.__bookLogDb) {
    globalForDb.__bookLogDb = createClient({ url: url!, authToken: authToken! });
  }
  return globalForDb.__bookLogDb;
}

async function initSchema(client: Client) {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        nickname TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT,
        genre TEXT,
        cover_url TEXT,
        description TEXT,
        purchase_url TEXT,
        isbn TEXT,
        view_count INTEGER NOT NULL DEFAULT 0,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating REAL NOT NULL CHECK (rating BETWEEN 0.5 AND 5 AND rating * 2 = CAST(rating * 2 AS INTEGER)),
        content TEXT,
        is_public INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (book_id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS reading_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        log_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('read', 'skipped')),
        book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
        custom_title TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (user_id, log_date)
      )`,
      `CREATE TABLE IF NOT EXISTS aladin_search_cache (
        isbn TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        publisher TEXT,
        cover TEXT,
        description TEXT,
        link TEXT,
        cached_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      // "서재에서 삭제" hides a book from one user's library grid without
      // touching the shared book row or anyone's review (including their own,
      // unless they also opt into deleting it).
      `CREATE TABLE IF NOT EXISTS library_hidden (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, book_id)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id)`,
      `CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_reading_logs_user_date ON reading_logs(user_id, log_date)`,
      `CREATE INDEX IF NOT EXISTS idx_aladin_cache_title ON aladin_search_cache(title)`,
    ],
    "write"
  );

  // Migration guard: view_count was added after the books table already
  // existed in production, so CREATE TABLE IF NOT EXISTS above won't add it.
  try {
    await client.execute(
      "ALTER TABLE books ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0"
    );
  } catch {
    // column already exists
  }

  // Migration guard: users switched from email-based login to a plain
  // username, so rename the existing column instead of losing accounts.
  try {
    await client.execute("ALTER TABLE users RENAME COLUMN email TO username");
  } catch {
    // column already renamed (or table was created fresh with username)
  }

  // Migration guard: reviews.rating started as INTEGER (whole stars only).
  // SQLite can't ALTER a column's type/CHECK in place, so rebuild the table
  // when the old integer-only constraint is still present.
  const reviewsSql = await client.execute(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'reviews'"
  );
  const currentDdl = reviewsSql.rows[0]?.[0] as string | undefined;
  if (currentDdl && currentDdl.includes("rating INTEGER")) {
    await client.batch(
      [
        `CREATE TABLE reviews_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          rating REAL NOT NULL CHECK (rating BETWEEN 0.5 AND 5 AND rating * 2 = CAST(rating * 2 AS INTEGER)),
          content TEXT,
          is_public INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE (book_id, user_id)
        )`,
        `INSERT INTO reviews_new SELECT * FROM reviews`,
        `DROP TABLE reviews`,
        `ALTER TABLE reviews_new RENAME TO reviews`,
        `CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id)`,
        `CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`,
      ],
      "write"
    );
  }
}

export async function getDb(): Promise<Client> {
  const client = getClient();
  if (!globalForDb.__bookLogDbInit) {
    globalForDb.__bookLogDbInit = initSchema(client);
  }
  await globalForDb.__bookLogDbInit;
  return client;
}

// libsql's Row objects aren't plain objects (they're array-like with getters),
// so they can't cross the Server -> Client Component boundary as-is. Convert
// every row to a genuine plain object before it's used as props anywhere.
export function rowsToObjects<T = Record<string, unknown>>(
  result: ResultSet
): T[] {
  return result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < result.columns.length; i++) {
      obj[result.columns[i]] = row[i];
    }
    return obj as T;
  });
}
