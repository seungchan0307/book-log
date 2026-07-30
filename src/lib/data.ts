import db from "@/lib/db";
import { shiftDateString, todayDateString } from "@/lib/date";
import type {
  BookOption,
  BookWithStats,
  DayStatus,
  PublicReview,
  ReadingLog,
  ReviewWithBook,
} from "@/lib/types";

const BOOK_STATS_SELECT = `
  SELECT
    b.id, b.title, b.author, b.genre, b.cover_url, b.description,
    b.purchase_url, b.created_by, b.created_at,
    ROUND(AVG(r.rating), 2) AS avg_rating,
    COUNT(r.id) AS review_count,
    my.rating AS my_rating,
    my.content AS my_review_content,
    my.is_public AS my_review_is_public
  FROM books b
  LEFT JOIN reviews r ON r.book_id = b.id
  LEFT JOIN reviews my ON my.book_id = b.id AND my.user_id = ?
`;

export function listBooksWithStats(
  currentUserId: number | null,
  opts: { search?: string; genre?: string } = {}
): BookWithStats[] {
  const clauses: string[] = [];
  const params: unknown[] = [currentUserId ?? -1];

  if (opts.search) {
    clauses.push("(b.title LIKE ? OR b.author LIKE ?)");
    const like = `%${opts.search}%`;
    params.push(like, like);
  }
  if (opts.genre) {
    clauses.push("b.genre = ?");
    params.push(opts.genre);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `${BOOK_STATS_SELECT} ${where} GROUP BY b.id ORDER BY b.created_at DESC`
    )
    .all(...params) as BookWithStats[];

  return rows;
}

export function getBookWithStats(
  bookId: number,
  currentUserId: number | null
): BookWithStats | null {
  const row = db
    .prepare(`${BOOK_STATS_SELECT} WHERE b.id = ? GROUP BY b.id`)
    .get(currentUserId ?? -1, bookId) as BookWithStats | undefined;
  return row ?? null;
}

export function getPublicReviewsForBook(
  bookId: number,
  excludeUserId: number | null
): PublicReview[] {
  return db
    .prepare(
      `SELECT rv.*, u.nickname AS reviewer_nickname
       FROM reviews rv
       JOIN users u ON u.id = rv.user_id
       WHERE rv.book_id = ? AND rv.is_public = 1 AND rv.user_id != ?
         AND rv.content IS NOT NULL
       ORDER BY rv.updated_at DESC`
    )
    .all(bookId, excludeUserId ?? -1) as PublicReview[];
}

export function listMyReviews(userId: number): ReviewWithBook[] {
  return db
    .prepare(
      `SELECT r.*, b.title AS book_title, b.author AS book_author
       FROM reviews r
       JOIN books b ON b.id = r.book_id
       WHERE r.user_id = ?
       ORDER BY r.updated_at DESC`
    )
    .all(userId) as ReviewWithBook[];
}

export function getTopRatedBooks(
  currentUserId: number | null,
  limit = 10
): BookWithStats[] {
  const rows = db
    .prepare(
      `${BOOK_STATS_SELECT}
       GROUP BY b.id
       HAVING review_count >= 1
       ORDER BY avg_rating DESC, review_count DESC
       LIMIT ?`
    )
    .all(currentUserId ?? -1, limit) as BookWithStats[];
  return rows;
}

export function hasFavoriteGenres(userId: number): boolean {
  const row = db
    .prepare(
      `SELECT 1
       FROM reviews r
       JOIN books b ON b.id = r.book_id
       WHERE r.user_id = ? AND r.rating >= 4 AND b.genre IS NOT NULL
       LIMIT 1`
    )
    .get(userId);
  return Boolean(row);
}

export function getPersonalizedRecommendations(
  userId: number,
  limit = 10
): BookWithStats[] {
  const favoriteGenres = db
    .prepare(
      `SELECT DISTINCT b.genre AS genre
       FROM reviews r
       JOIN books b ON b.id = r.book_id
       WHERE r.user_id = ? AND r.rating >= 4 AND b.genre IS NOT NULL`
    )
    .all(userId) as { genre: string }[];

  if (favoriteGenres.length === 0) return [];

  const placeholders = favoriteGenres.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `${BOOK_STATS_SELECT}
       WHERE b.genre IN (${placeholders})
         AND b.id NOT IN (SELECT book_id FROM reviews WHERE user_id = ?)
       GROUP BY b.id
       HAVING review_count >= 1
       ORDER BY avg_rating DESC, review_count DESC
       LIMIT ?`
    )
    .all(
      userId,
      ...favoriteGenres.map((g) => g.genre),
      userId,
      limit
    ) as BookWithStats[];

  return rows;
}

export function listAllBookOptions(): BookOption[] {
  return db
    .prepare(`SELECT id, title, author FROM books ORDER BY title ASC`)
    .all() as BookOption[];
}

export function getTodayReadingLog(userId: number): ReadingLog | null {
  const row = db
    .prepare(`SELECT * FROM reading_logs WHERE user_id = ? AND log_date = ?`)
    .get(userId, todayDateString()) as ReadingLog | undefined;
  return row ?? null;
}

export function getTotalReadDays(userId: number): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count FROM reading_logs WHERE user_id = ? AND status = 'read'`
    )
    .get(userId) as { count: number };
  return row.count;
}

export function getCurrentStreak(userId: number): number {
  const todayLog = getTodayReadingLog(userId);
  if (todayLog && todayLog.status === "skipped") return 0;

  const rows = db
    .prepare(
      `SELECT log_date FROM reading_logs WHERE user_id = ? AND status = 'read'`
    )
    .all(userId) as { log_date: string }[];
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

export function getMonthReadingDays(
  userId: number,
  year: number,
  month: number
): DayStatus[] {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const rows = db
    .prepare(
      `SELECT log_date, status FROM reading_logs
       WHERE user_id = ? AND log_date BETWEEN ? AND ?`
    )
    .all(userId, start, end) as { log_date: string; status: "read" | "skipped" }[];

  const statusByDate = new Map(rows.map((r) => [r.log_date, r.status]));

  const result: DayStatus[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    result.push({ date, status: statusByDate.get(date) ?? null });
  }
  return result;
}
