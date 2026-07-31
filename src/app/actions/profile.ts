"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { todayDateString } from "@/lib/date";

export type ProfileFormState = { error?: string; success?: boolean };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const nickname = String(formData.get("nickname") ?? "").trim();
  const birthdateRaw = String(formData.get("birthdate") ?? "").trim();

  if (nickname.length < 1 || nickname.length > 20) {
    return { error: "닉네임은 1~20자로 입력해주세요." };
  }

  let birthdate: string | null = null;
  if (birthdateRaw) {
    if (!DATE_RE.test(birthdateRaw) || birthdateRaw > todayDateString()) {
      return { error: "올바른 생년월일을 입력해주세요." };
    }
    birthdate = birthdateRaw;
  }

  const db = await getDb();
  await db.execute({
    sql: "UPDATE users SET nickname = ?, birthdate = ? WHERE id = ?",
    args: [nickname, birthdate, user.id],
  });

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { success: true };
}
