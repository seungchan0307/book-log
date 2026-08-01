"use server";

import { revalidatePath } from "next/cache";
import { upsertReadingStatusAndReview } from "@/app/actions/books";
import { getDb } from "@/lib/db";
import { parseReadingStatus, validateReadingSubmission } from "@/lib/readingStatus";
import { getCurrentUser } from "@/lib/session";

export type ReviewFormState = { error?: string; success?: boolean };

export async function upsertReview(
  _prevState: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const bookId = Number(formData.get("book_id"));
  const rating = Number(formData.get("rating"));
  const content = String(formData.get("content") ?? "").trim();
  const isPublic = formData.get("is_public") ? 1 : 0;
  const isAnonymous = formData.get("is_anonymous") ? 1 : 0;
  const readingStatus = parseReadingStatus(
    String(formData.get("reading_status") ?? "").trim()
  );

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return { error: "잘못된 요청입니다." };
  }
  const validationError = validateReadingSubmission(
    readingStatus,
    rating,
    content
  );
  if (validationError) return { error: validationError };

  const db = await getDb();
  const book = await db.execute({
    sql: "SELECT id FROM books WHERE id = ?",
    args: [bookId],
  });
  if (book.rows.length === 0) {
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

export async function deleteReview(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const reviewId = Number(formData.get("review_id"));
  if (!Number.isInteger(reviewId) || reviewId <= 0) return;

  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT book_id FROM reviews WHERE id = ? AND user_id = ?",
    args: [reviewId, user.id],
  });
  const review = result.rows[0] as unknown as { book_id: number } | undefined;
  if (!review) return;

  await db.execute({
    sql: "DELETE FROM reviews WHERE id = ? AND user_id = ?",
    args: [reviewId, user.id],
  });

  revalidatePath("/library");
  revalidatePath("/recommend");
  revalidatePath(`/books/${review.book_id}`);
}

export async function deleteReviewForBook(bookId: number) {
  const user = await getCurrentUser();
  if (!user) return;

  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM reviews WHERE book_id = ? AND user_id = ?",
    args: [bookId, user.id],
  });

  revalidatePath("/library");
  revalidatePath("/recommend");
  revalidatePath(`/books/${bookId}`);
}

export type ToggleLikeResult =
  | { liked: boolean; likeCount: number }
  | { error: string };

export async function toggleReviewLike(
  reviewId: number
): Promise<ToggleLikeResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return { error: "잘못된 요청입니다." };
  }

  const db = await getDb();
  const review = await db.execute({
    sql: "SELECT book_id FROM reviews WHERE id = ?",
    args: [reviewId],
  });
  const bookId = (review.rows[0] as unknown as { book_id: number } | undefined)
    ?.book_id;
  if (!bookId) {
    return { error: "존재하지 않는 감상입니다." };
  }

  // INSERT ... ON CONFLICT DO NOTHING instead of SELECT-then-branch: two
  // overlapping toggles (a fast double click) can no longer both see "not
  // liked yet" and both try to INSERT, which used to throw on the second
  // one and leave the button's local state stuck out of sync.
  const inserted = await db.execute({
    sql: `INSERT INTO review_likes (user_id, review_id) VALUES (?, ?)
          ON CONFLICT(user_id, review_id) DO NOTHING`,
    args: [user.id, reviewId],
  });
  const liked = inserted.rowsAffected > 0;

  if (!liked) {
    await db.execute({
      sql: "DELETE FROM review_likes WHERE user_id = ? AND review_id = ?",
      args: [user.id, reviewId],
    });
  }

  const countResult = await db.execute({
    sql: "SELECT COUNT(*) AS count FROM review_likes WHERE review_id = ?",
    args: [reviewId],
  });
  const likeCount = (countResult.rows[0] as unknown as { count: number })
    .count;

  revalidatePath("/recommend");
  revalidatePath(`/books/${bookId}`);
  return { liked, likeCount };
}
