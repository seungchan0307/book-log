"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
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

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return { error: "잘못된 요청입니다." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "평점은 1~5점 사이여야 합니다." };
  }
  if (content.length > 4000) {
    return { error: "감상평은 4000자 이내로 작성해주세요." };
  }

  const db = await getDb();
  const book = await db.execute({
    sql: "SELECT id FROM books WHERE id = ?",
    args: [bookId],
  });
  if (book.rows.length === 0) {
    return { error: "존재하지 않는 책입니다." };
  }

  await db.execute({
    sql: `INSERT INTO reviews (book_id, user_id, rating, content, is_public)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(book_id, user_id)
          DO UPDATE SET rating = excluded.rating, content = excluded.content,
            is_public = excluded.is_public, updated_at = datetime('now')`,
    args: [bookId, user.id, rating, content || null, isPublic],
  });

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
