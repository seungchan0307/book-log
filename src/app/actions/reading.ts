"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { todayDateString } from "@/lib/date";
import { getCurrentStreak, getTotalReadDays } from "@/lib/data";
import type { ReadingLogStatus } from "@/lib/types";

export type CheckinResult =
  | { error: string }
  | {
      success: true;
      status: ReadingLogStatus;
      streak: number;
      totalDaysRead: number;
      bookmarkTokensEarned: number;
    };

export async function submitReadingCheckin(
  status: ReadingLogStatus,
  bookId: number | null,
  customTitle: string | null
): Promise<CheckinResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const trimmedTitle = customTitle?.trim() ?? "";
  const db = await getDb();

  if (status === "read") {
    if (bookId !== null) {
      const book = await db.execute({
        sql: "SELECT id FROM books WHERE id = ?",
        args: [bookId],
      });
      if (book.rows.length === 0) {
        return { error: "존재하지 않는 책입니다." };
      }
    } else if (trimmedTitle.length === 0) {
      return { error: "읽은 책 제목을 입력해주세요." };
    } else if (trimmedTitle.length > 200) {
      return { error: "책 제목은 200자 이내로 입력해주세요." };
    }
  }

  const today = todayDateString();
  const existing = await db.execute({
    sql: "SELECT id FROM reading_logs WHERE user_id = ? AND log_date = ?",
    args: [user.id, today],
  });
  if (existing.rows.length > 0) {
    return { error: "오늘은 이미 기록을 남겼어요." };
  }

  await db.execute({
    sql: `INSERT INTO reading_logs (user_id, log_date, status, book_id, custom_title)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      user.id,
      today,
      status,
      status === "read" ? bookId : null,
      status === "read" && bookId === null ? trimmedTitle : null,
    ],
  });

  // 책갈피 토큰: one per check-in (읽음 or 읽지 않음 both count as showing
  // up), bumped to two once the read-streak this check-in extends reaches 3+
  // — reuses the same streak the 연속 읽는 중 banner already shows, rather
  // than tracking a second "visit streak" concept.
  const streak = await getCurrentStreak(user.id);
  const bookmarkTokensEarned = streak >= 3 ? 2 : 1;
  await db.execute({
    sql: "UPDATE users SET bookmark_tokens = bookmark_tokens + ? WHERE id = ?",
    args: [bookmarkTokensEarned, user.id],
  });

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/bookshelf");
  revalidatePath("/library");

  return {
    success: true,
    status,
    streak,
    totalDaysRead: await getTotalReadDays(user.id),
    bookmarkTokensEarned,
  };
}
