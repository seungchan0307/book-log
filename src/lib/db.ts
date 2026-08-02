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
        birthdate TEXT,
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
        is_anonymous INTEGER NOT NULL DEFAULT 0,
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
      `CREATE TABLE IF NOT EXISTS review_likes (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, review_id)
      )`,
      // Bumped (not inserted fresh) on every click-through from an explore
      // search, so "최근 검색한 책" reflects the last time each book was
      // searched, not the first.
      `CREATE TABLE IF NOT EXISTS search_history (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        searched_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, book_id)
      )`,
      // Shared by login and password-reset — both are guessing attacks
      // against a username (password vs. low-entropy birthdate), so both
      // get locked out the same way. Not tied to a real user row since
      // tracking attempts against usernames that don't exist is exactly
      // what stops enumeration.
      `CREATE TABLE IF NOT EXISTS login_attempts (
        username TEXT PRIMARY KEY,
        failed_count INTEGER NOT NULL DEFAULT 0,
        locked_until TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      // Separate from reviews since 읽는 중 / 읽을 예정 don't have a rating —
      // reviews.rating stays NOT NULL and only real reviews live there.
      `CREATE TABLE IF NOT EXISTS reading_status (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        status TEXT NOT NULL CHECK (status IN ('finished', 'reading', 'want_to_read')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, book_id)
      )`,
      // Granted once per book the first time it reaches 'finished' (see
      // upsertReadingStatusAndReview). Sits unused until the user spends it
      // on /bookshelf, at which point used_at is stamped and a
      // bookshelf_items row is created from it.
      `CREATE TABLE IF NOT EXISTS gacha_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        used_at TEXT
      )`,
      // One row per gacha pull. id ordering doubles as pull order, which is
      // exactly the order the 책장 shelf displays items in.
      `CREATE TABLE IF NOT EXISTS bookshelf_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
        item_key TEXT NOT NULL,
        rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_gacha_tickets_user ON gacha_tickets(user_id, used_at)`,
      `CREATE INDEX IF NOT EXISTS idx_bookshelf_items_user ON bookshelf_items(user_id, id)`,
      `CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id)`,
      `CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_reading_logs_user_date ON reading_logs(user_id, log_date)`,
      `CREATE INDEX IF NOT EXISTS idx_aladin_cache_title ON aladin_search_cache(title)`,
      `CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id)`,
      `CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, searched_at)`,
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

  // Migration guard: birthdate was added after the users table already
  // existed in production, so CREATE TABLE IF NOT EXISTS above won't add it.
  try {
    await client.execute("ALTER TABLE users ADD COLUMN birthdate TEXT");
  } catch {
    // column already exists
  }

  // Migration guard: is_anonymous was added after the reviews table already
  // existed in production, so CREATE TABLE IF NOT EXISTS above won't add it.
  try {
    await client.execute(
      "ALTER TABLE reviews ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0"
    );
  } catch {
    // column already exists
  }

  // Migration guard: monthly_goal (통계 페이지의 "이번 달 목표") was added
  // after the users table already existed in production.
  try {
    await client.execute("ALTER TABLE users ADD COLUMN monthly_goal INTEGER");
  } catch {
    // column already exists
  }

  // Migration guard: bookmark_tokens (책갈피 토큰, earned via daily 독서
  // 캘린더 check-ins) and bookshelf_rows (rows of 8 slots purchased with
  // those tokens) were added after the users table already existed.
  try {
    await client.execute(
      "ALTER TABLE users ADD COLUMN bookmark_tokens INTEGER NOT NULL DEFAULT 0"
    );
  } catch {
    // column already exists
  }
  try {
    await client.execute(
      "ALTER TABLE users ADD COLUMN bookshelf_rows INTEGER NOT NULL DEFAULT 1"
    );
  } catch {
    // column already exists
  }

  // Migration guard: finished_at was added after reading_status already
  // existed in production. Set once, the first time a book reaches
  // 'finished', and never overwritten afterward — unlike updated_at, which
  // bumps on every edit, so it can't double-count a book across months.
  try {
    await client.execute("ALTER TABLE reading_status ADD COLUMN finished_at TEXT");
  } catch {
    // column already exists
  }
  // Backfill: books already marked finished before this column existed get
  // a best-effort finished_at (their review's created_at, or their
  // reading_status row's updated_at as a fallback) so past months in the
  // 월별 독서량 chart aren't retroactively emptied out. Only touches rows
  // still NULL, so it's a no-op after the first run.
  await client.execute(`
    UPDATE reading_status
    SET finished_at = COALESCE(
      (SELECT r.created_at FROM reviews r
        WHERE r.book_id = reading_status.book_id AND r.user_id = reading_status.user_id),
      reading_status.updated_at
    )
    WHERE status = 'finished' AND finished_at IS NULL
  `);
  // Backfill (part 2): reviews left before reading_status existed have no
  // row there at all — LibraryClient has always treated that specific gap
  // as "읽은 책". Materialize it as a real finished row instead of leaving
  // every stats/goal query to special-case the gap.
  await client.execute(`
    INSERT INTO reading_status (user_id, book_id, status, finished_at, created_at, updated_at)
    SELECT r.user_id, r.book_id, 'finished', r.created_at, r.created_at, r.created_at
    FROM reviews r
    WHERE NOT EXISTS (
      SELECT 1 FROM reading_status rs
      WHERE rs.user_id = r.user_id AND rs.book_id = r.book_id
    )
  `);

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
