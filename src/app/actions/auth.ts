"use server";

import { redirect } from "next/navigation";
import db from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createUserSession, destroySession } from "@/lib/session";

export type AuthFormState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) {
    return { error: "올바른 이메일 형식이 아닙니다." };
  }
  if (nickname.length < 1 || nickname.length > 20) {
    return { error: "닉네임은 1~20자로 입력해주세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email);
  if (existing) {
    return { error: "이미 가입된 이메일입니다." };
  }

  const passwordHash = await hashPassword(password);
  const result = db
    .prepare(
      "INSERT INTO users (email, nickname, password_hash) VALUES (?, ?, ?)"
    )
    .run(email, nickname, passwordHash);

  await createUserSession(Number(result.lastInsertRowid));
  redirect("/library");
}

export async function logIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = db
    .prepare("SELECT id, password_hash FROM users WHERE email = ?")
    .get(email) as { id: number; password_hash: string } | undefined;

  if (!user) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  await createUserSession(user.id);
  redirect("/library");
}

export async function logOut() {
  await destroySession();
  redirect("/");
}
