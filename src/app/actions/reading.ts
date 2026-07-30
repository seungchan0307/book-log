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

  revalidatePath("/");
  revalidatePath("/calendar");

  return {
    success: true,
    status,
    streak: await getCurrentStreak(user.id),
    totalDaysRead: await getTotalReadDays(user.id),
  };
}
