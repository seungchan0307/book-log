import { getDb, rowsToObjects } from "@/lib/db";
import { shiftDateString, todayDateString } from "@/lib/date";
import type {
  BookOption,
  BookWithStats,
  DayStatus,
  PopularReview,
  PublicReview,
  ReadingLog,
  ReviewWithBook,
} from "@/lib/types";

const BOOK_STATS_SELECT = `
  SELECT
    b.id, b.title, b.author, b.genre, b.cover_url, b.description,
    b.purchase_url, b.view_count, b.created_by, b.created_at,
    ROUND(AVG(r.rating), 2) AS avg_rating,
    COUNT(r.id) AS review_count,
    my.rating AS my_rating,
    my.content AS my_review_content,
    my.is_public AS my_review_is_public,
    my.is_anonymous AS my_review_is_anonymous
  FROM books b
  LEFT JOIN reviews r ON r.book_id = b.id
  LEFT JOIN reviews my ON my.book_id = b.id AND my.user_id = ?
`;

// The 서재 page is each user's own shelf — only books they registered or
// reviewed, not the whole shared catalog (that's what /explore is for).
// avg_rating/review_count still reflect everyone's reviews.
export async function listMyBooksWithStats(
  userId: number,
  opts: { search?: string; genre?: string } = {}
): Promise<BookWithStats[]> {
  const clauses: string[] = [
    `b.id IN (
      SELECT book_id FROM reviews WHERE user_id = ?
      UNION
      SELECT id FROM books WHERE created_by = ?
    )`,
    `b.id NOT IN (SELECT book_id FROM library_hidden WHERE user_id = ?)`,
  ];
  const args: (string | number)[] = [userId, userId, userId, userId];

  if (opts.search) {
    clauses.push("(b.title LIKE ? OR b.author LIKE ?)");
    const like = `%${opts.search}%`;
    args.push(like, like);
  }
  if (opts.genre) {
    clauses.push("b.genre = ?");
    args.push(opts.genre);
  }

  const where = `WHERE ${clauses.join(" AND ")}`;

  const db = await getDb();
  const result = await db.execute({
    sql: `${BOOK_STATS_SELECT} ${where} GROUP BY b.id ORDER BY b.created_at DESC`,
    args,
  });
  return rowsToObjects<BookWithStats>(result);
}

export async function getBookWithStats(
  bookId: number,
  currentUserId: number | null
): Promise<BookWithStats | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: `${BOOK_STATS_SELECT} WHERE b.id = ? GROUP BY b.id`,
    args: [currentUserId ?? -1, bookId],
  });
  return rowsToObjects<BookWithStats>(result)[0] ?? null;
}

export async function getPublicReviewsForBook(
  bookId: number,
  excludeUserId: number | null
): Promise<PublicReview[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT rv.*,
                 CASE WHEN rv.is_anonymous = 1 THEN '익명' ELSE u.nickname END
                   AS reviewer_nickname
          FROM reviews rv
          JOIN users u ON u.id = rv.user_id
          WHERE rv.book_id = ? AND rv.is_public = 1 AND rv.user_id != ?
            AND rv.content IS NOT NULL
          ORDER BY rv.updated_at DESC`,
    args: [bookId, excludeUserId ?? -1],
  });
  return rowsToObjects<PublicReview>(result);
}

export async function listMyReviews(userId: number): Promise<ReviewWithBook[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT r.*, b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url
          FROM reviews r
          JOIN books b ON b.id = r.book_id
          WHERE r.user_id = ?
          ORDER BY r.updated_at DESC`,
    args: [userId],
  });
  return rowsToObjects<ReviewWithBook>(result);
}

export async function searchBooksForExplore(
  currentUserId: number | null,
  search: string
): Promise<BookWithStats[]> {
  const args: (string | number)[] = [currentUserId ?? -1];
  let where = "";
  if (search) {
    where = "WHERE (b.title LIKE ? OR b.author LIKE ?)";
    const like = `%${search}%`;
    args.push(like, like);
  }

  const db = await getDb();
  const result = await db.execute({
    sql: `${BOOK_STATS_SELECT} ${where}
          GROUP BY b.id
          ORDER BY b.view_count DESC, review_count DESC`,
    args,
  });
  return rowsToObjects<BookWithStats>(result);
}

// Aladin's "Book" search occasionally turns up non-book goods (sticker
// packs, mini-books bundled with merch, etc). Real books always carry a
// proper Bookland ISBN (978/979 prefix) or, for manual entries, no ISBN at
// all — goods use ordinary retail barcodes instead, so this filters those
// out of curated picks without needing a dedicated "is this a book" field.
const LOOKS_LIKE_A_BOOK_WHERE = `
  (b.isbn IS NULL OR b.isbn LIKE '978%' OR b.isbn LIKE '979%')
  AND b.title NOT LIKE '%스티커%'
`;

export async function getMostViewedBooks(
  currentUserId: number | null,
  limit = 10
): Promise<BookWithStats[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `${BOOK_STATS_SELECT}
          WHERE ${LOOKS_LIKE_A_BOOK_WHERE}
          GROUP BY b.id
          HAVING b.view_count > 0
          ORDER BY b.view_count DESC, review_count DESC
          LIMIT ?`,
    args: [currentUserId ?? -1, limit],
  });
  return rowsToObjects<BookWithStats>(result);
}

// minReviews keeps a single 5-star rating from one or two people out of the
// top spot — a book needs a decent number of raters to qualify.
export async function getTopRatedBooks(
  currentUserId: number | null,
  minReviews: number,
  limit = 10
): Promise<BookWithStats[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `${BOOK_STATS_SELECT}
          WHERE ${LOOKS_LIKE_A_BOOK_WHERE}
          GROUP BY b.id
          HAVING review_count >= ?
          ORDER BY avg_rating DESC, review_count DESC
          LIMIT ?`,
    args: [currentUserId ?? -1, minReviews, limit],
  });
  return rowsToObjects<BookWithStats>(result);
}

export async function incrementBookViewCount(bookId: number): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: `UPDATE books SET view_count = view_count + 1 WHERE id = ?`,
    args: [bookId],
  });
}

export async function getPopularReviews(limit = 20): Promise<PopularReview[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT rv.*,
                 CASE WHEN rv.is_anonymous = 1 THEN '익명' ELSE u.nickname END
                   AS reviewer_nickname,
                 b.title AS book_title, b.author AS book_author,
                 b.cover_url AS book_cover_url, b.view_count AS book_view_count
          FROM reviews rv
          JOIN users u ON u.id = rv.user_id
          JOIN books b ON b.id = rv.book_id
          WHERE rv.is_public = 1 AND rv.content IS NOT NULL
          ORDER BY b.view_count DESC, rv.updated_at DESC
          LIMIT ?`,
    args: [limit],
  });
  return rowsToObjects<PopularReview>(result);
}

export async function hasFavoriteGenres(userId: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT 1
          FROM reviews r
          JOIN books b ON b.id = r.book_id
          WHERE r.user_id = ? AND r.rating >= 4 AND b.genre IS NOT NULL
          LIMIT 1`,
    args: [userId],
  });
  return result.rows.length > 0;
}

export async function getPersonalizedRecommendations(
  userId: number,
  limit = 10
): Promise<BookWithStats[]> {
  const db = await getDb();
  const genreResult = await db.execute({
    sql: `SELECT DISTINCT b.genre AS genre
          FROM reviews r
          JOIN books b ON b.id = r.book_id
          WHERE r.user_id = ? AND r.rating >= 4 AND b.genre IS NOT NULL`,
    args: [userId],
  });
  const favoriteGenres = rowsToObjects<{ genre: string }>(genreResult);

  if (favoriteGenres.length === 0) return [];

  const placeholders = favoriteGenres.map(() => "?").join(", ");
  const result = await db.execute({
    sql: `${BOOK_STATS_SELECT}
          WHERE b.genre IN (${placeholders})
            AND b.id NOT IN (SELECT book_id FROM reviews WHERE user_id = ?)
          GROUP BY b.id
          HAVING review_count >= 1
          ORDER BY avg_rating DESC, review_count DESC
          LIMIT ?`,
    args: [
      userId,
      ...favoriteGenres.map((g) => g.genre),
      userId,
      limit,
    ],
  });
  return rowsToObjects<BookWithStats>(result);
}

// Only books the user has actually reviewed — the reading calendar's
// check-in dropdown should offer their own library, not every shared book.
export async function listMyBookOptions(
  userId: number
): Promise<BookOption[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT DISTINCT b.id, b.title, b.author
          FROM books b
          JOIN reviews r ON r.book_id = b.id
          WHERE r.user_id = ?
          ORDER BY b.title ASC`,
    args: [userId],
  });
  return rowsToObjects<BookOption>(result);
}

export async function getTodayReadingLog(
  userId: number
): Promise<ReadingLog | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT * FROM reading_logs WHERE user_id = ? AND log_date = ?`,
    args: [userId, todayDateString()],
  });
  return rowsToObjects<ReadingLog>(result)[0] ?? null;
}

export async function getTotalReadDays(userId: number): Promise<number> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT COUNT(*) AS count FROM reading_logs WHERE user_id = ? AND status = 'read'`,
    args: [userId],
  });
  const row = rowsToObjects<{ count: number }>(result)[0];
  return row.count;
}

export async function getCurrentStreak(userId: number): Promise<number> {
  const todayLog = await getTodayReadingLog(userId);
  if (todayLog && todayLog.status === "skipped") return 0;

  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT log_date FROM reading_logs WHERE user_id = ? AND status = 'read'`,
    args: [userId],
  });
  const rows = rowsToObjects<{ log_date: string }>(result);
  const readDates = new Set(rows.map((r) => r.log_date));

  const today = todayDateString();
  let cursor = readDates.has(today) ? today : shiftDateString(today, -1);

  let streak = 0;
  while (readDates.has(cursor)) {
    streak++;
    cursor = shiftDateString(cursor, -1);
  }
  return streak;
}

export async function getMonthReadingDays(
  userId: number,
  year: number,
  month: number
): Promise<DayStatus[]> {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const db = await getDb();
  const queryResult = await db.execute({
    sql: `SELECT log_date, status FROM reading_logs
          WHERE user_id = ? AND log_date BETWEEN ? AND ?`,
    args: [userId, start, end],
  });
  const rows = rowsToObjects<{
    log_date: string;
    status: "read" | "skipped";
  }>(queryResult);

  const statusByDate = new Map(rows.map((r) => [r.log_date, r.status]));

  const days: DayStatus[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ date, status: statusByDate.get(date) ?? null });
  }
  return days;
}
