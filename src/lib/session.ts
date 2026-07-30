import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import type { User } from "@/lib/types";

const SESSION_COOKIE = "session_token";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createUserSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
    args: [token, userId, expiresAt],
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.execute({
      sql: "DELETE FROM sessions WHERE token = ?",
      args: [token],
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT u.id, u.email, u.nickname, s.expires_at
          FROM sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token = ?`,
    args: [token],
  });

  const row = result.rows[0] as unknown as
    | { id: number; email: string; nickname: string; expires_at: string }
    | undefined;

  if (!row) return null;

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.execute({
      sql: "DELETE FROM sessions WHERE token = ?",
      args: [token],
    });
    return null;
  }

  return { id: row.id, email: row.email, nickname: row.nickname };
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }
  return user;
}
