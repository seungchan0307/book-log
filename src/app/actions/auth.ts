"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getTodayReadingLog } from "@/lib/data";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createUserSession, destroySession } from "@/lib/session";

export type AuthFormState = { error?: string };

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const password = String(formData.get("password") ?? "");

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
    sql: "INSERT INTO users (username, nickname, password_hash) VALUES (?, ?, ?)",
    args: [username, nickname, passwordHash],
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
  const result = await db.execute({
    sql: "SELECT id, password_hash FROM users WHERE username = ?",
    args: [username],
  });
  const user = result.rows[0] as unknown as
    | { id: number; password_hash: string }
    | undefined;

  if (!user) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  await createUserSession(user.id);
  const todayLog = await getTodayReadingLog(user.id);
  redirect(todayLog ? "/library" : "/calendar");
}

export async function logOut() {
  await destroySession();
  redirect("/");
}
