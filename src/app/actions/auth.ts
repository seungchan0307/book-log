"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getTodayReadingLog } from "@/lib/data";
import { todayDateString } from "@/lib/date";
import {
  checkLockout,
  clearAttempts,
  recordFailedAttempt,
} from "@/lib/loginAttempts";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createUserSession, destroySession } from "@/lib/session";

export type AuthFormState = { error?: string };

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const birthdateRaw = String(formData.get("birthdate") ?? "").trim();

  if (!USERNAME_RE.test(username)) {
    return {
      error: "아이디는 영문/숫자/밑줄(_)로 3~20자여야 합니다.",
    };
  }
  if (nickname.length < 1 || nickname.length > 20) {
    return { error: "닉네임은 1~20자로 입력해주세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }
  let birthdate: string | null = null;
  if (birthdateRaw) {
    if (!DATE_RE.test(birthdateRaw) || birthdateRaw > todayDateString()) {
      return { error: "올바른 생년월일을 입력해주세요." };
    }
    birthdate = birthdateRaw;
  }

  const db = await getDb();
  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE username = ?",
    args: [username],
  });
  if (existing.rows.length > 0) {
    return { error: "이미 사용 중인 아이디입니다." };
  }

  const passwordHash = await hashPassword(password);
  const result = await db.execute({
    sql: "INSERT INTO users (username, nickname, password_hash, birthdate) VALUES (?, ?, ?, ?)",
    args: [username, nickname, passwordHash, birthdate],
  });

  await createUserSession(Number(result.lastInsertRowid));
  redirect("/calendar");
}

export async function logIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const db = await getDb();

  const lockMessage = await checkLockout(db, username);
  if (lockMessage) return { error: lockMessage };

  const result = await db.execute({
    sql: "SELECT id, password_hash FROM users WHERE username = ?",
    args: [username],
  });
  const user = result.rows[0] as unknown as
    | { id: number; password_hash: string }
    | undefined;

  const valid = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !valid) {
    await recordFailedAttempt(db, username);
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  await clearAttempts(db, username);
  await createUserSession(user.id);
  const todayLog = await getTodayReadingLog(user.id);
  redirect(todayLog ? "/library" : "/calendar");
}

export type ResetPasswordFormState = { error?: string; success?: boolean };

// Account recovery without an email system: verify identity with
// username + birthdate (set on signup or in 프로필) instead of a reset
// link. Birthdate has far less entropy than a password, so this shares
// login's lockout counter to keep it from becoming the weaker attack path.
export async function resetPassword(
  _prevState: ResetPasswordFormState,
  formData: FormData
): Promise<ResetPasswordFormState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const birthdateInput = String(formData.get("birthdate") ?? "").trim();
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!DATE_RE.test(birthdateInput)) {
    return { error: "생년월일을 올바르게 입력해주세요." };
  }
  if (newPassword.length < 8) {
    return { error: "새 비밀번호는 8자 이상이어야 합니다." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "새 비밀번호가 일치하지 않습니다." };
  }

  const db = await getDb();

  const lockMessage = await checkLockout(db, username);
  if (lockMessage) return { error: lockMessage };

  const result = await db.execute({
    sql: "SELECT id, birthdate FROM users WHERE username = ?",
    args: [username],
  });
  const user = result.rows[0] as unknown as
    | { id: number; birthdate: string | null }
    | undefined;

  if (!user || !user.birthdate || user.birthdate !== birthdateInput) {
    await recordFailedAttempt(db, username);
    return { error: "아이디 또는 생년월일이 일치하지 않습니다." };
  }

  const passwordHash = await hashPassword(newPassword);
  await db.execute({
    sql: "UPDATE users SET password_hash = ? WHERE id = ?",
    args: [passwordHash, user.id],
  });
  await clearAttempts(db, username);

  return { success: true };
}

export async function logOut() {
  await destroySession();
  redirect("/");
}
