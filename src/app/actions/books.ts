"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getTopRatedBooksByGenre } from "@/lib/data";
import { searchAladin, type AladinBookResult } from "@/lib/aladin";
import { getCachedSearchResults, cacheSearchResults } from "@/lib/bookCache";
import {
  parseReadingStatus,
  validateReadingSubmission,
  type ReadingStatus,
} from "@/lib/readingStatus";
import type { BookWithStats } from "@/lib/types";

export type BookFormState = { error?: string; success?: boolean };

export type AladinSearchState =
  | { results: AladinBookResult[] }
  | { error: string };

export async function upsertReadingStatusAndReview(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: number,
  bookId: number,
  readingStatus: ReadingStatus,
  rating: number,
  content: string,
  isPublic: number,
  isAnonymous: number
) {
  // want_to_read never carries a review even if a stray rating slipped
  // through; reading only inserts one if the user opted in.
  if (rating > 0 && readingStatus !== "want_to_read") {
    await db.execute({
      sql: `INSERT INTO reviews (book_id, user_id, rating, content, is_public, is_anonymous)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(book_id, user_id)
            DO UPDATE SET rating = excluded.rating, content = excluded.content,
              is_public = excluded.is_public, is_anonymous = excluded.is_anonymous,
              updated_at = datetime('now')`,
      args: [bookId, userId, rating, content || null, isPublic, isAnonymous],
    });
  }

  // finished_at is set once, the first time this book reaches 'finished',
  // and preserved on every later upsert (edits, re-saves, status toggles)
  // so it reflects when the book was actually finished, not last touched.
  // Read it beforehand so a gacha ticket (see below) is only granted the
  // same one time finished_at itself would be set, not on every re-save or
  // status toggle back to 'finished'.
  const prior = await db.execute({
    sql: "SELECT finished_at FROM reading_status WHERE user_id = ? AND book_id = ?",
    args: [userId, bookId],
  });
  const priorFinishedAt = (
    prior.rows[0] as unknown as { finished_at: string | null } | undefined
  )?.finished_at;
  const grantsGachaTicket = readingStatus === "finished" && !priorFinishedAt;

  await db.execute({
    sql: `INSERT INTO reading_status (user_id, book_id, status, finished_at)
          VALUES (?, ?, ?, CASE WHEN ? = 'finished' THEN datetime('now') ELSE NULL END)
          ON CONFLICT(user_id, book_id) DO UPDATE SET
            status = excluded.status,
            updated_at = datetime('now'),
            finished_at = CASE
              WHEN reading_status.finished_at IS NOT NULL THEN reading_status.finished_at
              WHEN excluded.status = 'finished' THEN datetime('now')
              ELSE reading_status.finished_at
            END`,
    args: [userId, bookId, readingStatus, readingStatus],
  });

  // Finishing a book earns one gacha pull, spent later on /bookshelf.
  if (grantsGachaTicket) {
    await db.execute({
      sql: "INSERT INTO gacha_tickets (user_id, book_id) VALUES (?, ?)",
      args: [userId, bookId],
    });
  }

  // Registering (or re-registering) a book is an explicit "put this back on
  // my shelf" — undo any earlier 서재에서 삭제 for it.
  await db.execute({
    sql: "DELETE FROM library_hidden WHERE user_id = ? AND book_id = ?",
    args: [userId, bookId],
  });
}

export async function searchAladinBooks(
  query: string
): Promise<AladinSearchState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return { error: "검색어를 입력해주세요." };
  }

  const cached = await getCachedSearchResults(trimmed);
  if (cached.length > 0) {
    return { results: cached };
  }

  try {
    const results = await searchAladin(trimmed);
    await cacheSearchResults(results);
    return { results };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "검색 중 오류가 발생했어요.",
    };
  }
}

// Same Aladin lookup as searchAladinBooks, but for the explore page's
// "찾아보기" search, which browsing doesn't require login for.
export async function searchAladinForExplore(
  query: string
): Promise<AladinSearchState> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { error: "검색어를 입력해주세요." };
  }

  const cached = await getCachedSearchResults(trimmed);
  if (cached.length > 0) {
    return { results: cached };
  }

  try {
    const results = await searchAladin(trimmed);
    await cacheSearchResults(results);
    return { results };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "검색 중 오류가 발생했어요.",
    };
  }
}

// Powers the recommend page's 장르별 인기 section — the genre is picked
// interactively client-side, so this needs to be a callable action rather
// than a plain data.ts function fetched at page render time.
export async function fetchTopRatedBooksByGenre(
  genre: string
): Promise<BookWithStats[]> {
  if (!genre) return [];
  const user = await getCurrentUser();
  return getTopRatedBooksByGenre(genre, user?.id ?? null, 10);
}

// Explore search results may point at a book nobody has catalogued yet.
// Clicking one should still land on a real /books/[id] page, so look it up
// by ISBN and create a bare (unreviewed, genre-less) stub if it's new.
export async function findOrCreateBookByIsbn(result: {
  isbn: string;
  title: string;
  author: string | null;
  cover: string | null;
  link: string | null;
}): Promise<{ bookId: number } | { error: string }> {
  if (!result.isbn || !result.title) {
    return { error: "잘못된 요청입니다." };
  }

  const db = await getDb();
  const existing = await db.execute({
    sql: "SELECT id FROM books WHERE isbn = ?",
    args: [result.isbn],
  });
  const existingRow = existing.rows[0] as unknown as { id: number } | undefined;
  if (existingRow) {
    return { bookId: existingRow.id };
  }

  const inserted = await db.execute({
    sql: `INSERT INTO books (title, author, cover_url, purchase_url, isbn)
          VALUES (?, ?, ?, ?, ?)`,
    args: [result.title, result.author, result.cover, result.link, result.isbn],
  });
  return { bookId: Number(inserted.lastInsertRowid) };
}

export async function addBookWithReview(
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim();
  const coverUrl = String(formData.get("cover_url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const purchaseUrl = String(formData.get("purchase_url") ?? "").trim();
  const isbn = String(formData.get("isbn") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const isPublic = formData.get("is_public") ? 1 : 0;
  const isAnonymous = formData.get("is_anonymous") ? 1 : 0;
  const readingStatusRaw = String(formData.get("reading_status") ?? "").trim();
  const readingStatus = parseReadingStatus(readingStatusRaw);

  if (title.length < 1 || title.length > 200) {
    return { error: "제목을 1~200자로 입력해주세요." };
  }
  // Title/author can be auto-filled from search, but genre can't — Aladin's
  // search doesn't reliably provide it, so require the user to actually
  // pick or type one themselves.
  if (!genre) {
    return { error: "장르를 선택하거나 직접 입력해주세요." };
  }
  if (genre.length > 20) {
    return { error: "장르는 20자 이내로 입력해주세요." };
  }
  if (coverUrl && !/^https?:\/\//.test(coverUrl)) {
    return { error: "표지 URL은 http(s)로 시작해야 합니다." };
  }
  if (purchaseUrl && !/^https?:\/\//.test(purchaseUrl)) {
    return { error: "구매 링크는 http(s)로 시작해야 합니다." };
  }
  const rating = ratingRaw ? Number(ratingRaw) : 0;
  const validationError = validateReadingSubmission(readingStatus, rating, content);
  if (validationError) {
    return { error: validationError };
  }

  const db = await getDb();

  // Reuse an existing book (matched by ISBN, or by title+author for manual
  // entries without one) instead of creating a duplicate row when the user
  // is really just leaving a review on a book already in the library.
  const existing = isbn
    ? await db.execute({
        sql: "SELECT id FROM books WHERE isbn = ?",
        args: [isbn],
      })
    : await db.execute({
        sql: "SELECT id FROM books WHERE title = ? AND author IS ?",
        args: [title, author || null],
      });
  const existingRow = existing.rows[0] as unknown as { id: number } | undefined;

  let bookId: number;
  if (existingRow) {
    bookId = existingRow.id;
  } else {
    const inserted = await db.execute({
      sql: `INSERT INTO books (title, author, genre, cover_url, description, purchase_url, isbn, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        title,
        author || null,
        genre || null,
        coverUrl || null,
        description || null,
        purchaseUrl || null,
        isbn || null,
        user.id,
      ],
    });
    bookId = Number(inserted.lastInsertRowid);
  }

  await upsertReadingStatusAndReview(
    db,
    user.id,
    bookId,
    readingStatus,
    rating,
    content,
    isPublic,
    isAnonymous
  );

  revalidatePath("/library");
  revalidatePath("/recommend");
  revalidatePath(`/books/${bookId}`);
  return { success: true };
}

// Adds a book that's already catalogued (found via its /books/[id] page)
// straight to the current user's library — skips the search/title/author/
// genre fields addBookWithReview needs, since all of that is already known.
export async function addExistingBookToLibrary(
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const bookId = Number(formData.get("book_id"));
  if (!Number.isInteger(bookId) || bookId <= 0) {
    return { error: "잘못된 요청입니다." };
  }

  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const isPublic = formData.get("is_public") ? 1 : 0;
  const isAnonymous = formData.get("is_anonymous") ? 1 : 0;
  const readingStatus = parseReadingStatus(
    String(formData.get("reading_status") ?? "").trim()
  );
  const rating = ratingRaw ? Number(ratingRaw) : 0;

  const validationError = validateReadingSubmission(readingStatus, rating, content);
  if (validationError) {
    return { error: validationError };
  }

  const db = await getDb();
  const existing = await db.execute({
    sql: "SELECT id FROM books WHERE id = ?",
    args: [bookId],
  });
  if (existing.rows.length === 0) {
    return { error: "존재하지 않는 책입니다." };
  }

  await upsertReadingStatusAndReview(
    db,
    user.id,
    bookId,
    readingStatus,
    rating,
    content,
    isPublic,
    isAnonymous
  );

  revalidatePath("/library");
  revalidatePath("/recommend");
  revalidatePath(`/books/${bookId}`);
  return { success: true };
}

// Removes a book from *my* library grid only — the book itself and my
// review both stay intact unless deleteReviewToo is set, since hiding it
// from my shelf and deleting my review are separate decisions.
export async function removeFromMyLibrary(
  bookId: number,
  deleteReviewToo: boolean
) {
  const user = await getCurrentUser();
  if (!user) return;

  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO library_hidden (user_id, book_id) VALUES (?, ?)
          ON CONFLICT(user_id, book_id) DO NOTHING`,
    args: [user.id, bookId],
  });

  if (deleteReviewToo) {
    await db.execute({
      sql: "DELETE FROM reviews WHERE book_id = ? AND user_id = ?",
      args: [bookId, user.id],
    });
  }

  revalidatePath("/library");
  revalidatePath("/recommend");
  revalidatePath("/explore");
  revalidatePath(`/books/${bookId}`);
}

// Fire-and-forget from explore whenever a search actually led somewhere —
// upsert so "최근 검색한 책" reflects the latest visit, not the first one.
export async function recordSearchHistory(bookId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO search_history (user_id, book_id) VALUES (?, ?)
          ON CONFLICT(user_id, book_id) DO UPDATE SET searched_at = datetime('now')`,
    args: [user.id, bookId],
  });
}

// Books created via ISBN lookup (explore search, 책 등록하기) start without a
// genre — Aladin's API doesn't return one. This lets anyone fill it in after
// the fact; it only ever sets a genre that's still missing, never overwrites
// one someone already picked.
export async function setBookGenre(
  bookId: number,
  genre: string
): Promise<{ error?: string; success?: true }> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmed = genre.trim();
  if (!trimmed) return { error: "장르를 선택해주세요." };
  if (trimmed.length > 20) return { error: "장르는 20자 이내로 입력해주세요." };

  const db = await getDb();
  await db.execute({
    sql: "UPDATE books SET genre = ? WHERE id = ? AND genre IS NULL",
    args: [trimmed, bookId],
  });

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/recommend");
  revalidatePath("/explore");
  return { success: true };
}
