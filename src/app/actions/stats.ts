"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export type SetMonthlyGoalState = { error?: string };

export async function setMonthlyGoal(
  target: number
): Promise<SetMonthlyGoalState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  if (!Number.isInteger(target) || target < 1 || target > 100) {
    return { error: "1~100 사이의 숫자를 입력해주세요." };
  }

  const db = await getDb();
  await db.execute({
    sql: "UPDATE users SET monthly_goal = ? WHERE id = ?",
    args: [target, user.id],
  });

  revalidatePath("/stats");
  return {};
}
