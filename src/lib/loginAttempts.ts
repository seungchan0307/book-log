import type { Client } from "@libsql/client";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Shared between login and password-reset — both are guessing attacks
// against a username, so both share the same lockout counter.
export async function checkLockout(
  db: Client,
  username: string
): Promise<string | null> {
  const result = await db.execute({
    sql: `SELECT
            (locked_until IS NOT NULL AND locked_until > datetime('now')) AS is_locked,
            CAST((julianday(locked_until) - julianday('now')) * 1440 AS INTEGER) + 1
              AS minutes_left
          FROM login_attempts WHERE username = ?`,
    args: [username],
  });
  const row = result.rows[0] as unknown as
    | { is_locked: number; minutes_left: number }
    | undefined;
  if (row?.is_locked) {
    return `시도 횟수를 초과했어요. ${row.minutes_left}분 후 다시 시도해주세요.`;
  }
  return null;
}

export async function recordFailedAttempt(
  db: Client,
  username: string
): Promise<void> {
  await db.execute({
    sql: `INSERT INTO login_attempts (username, failed_count, locked_until, updated_at)
          VALUES (?, 1, NULL, datetime('now'))
          ON CONFLICT(username) DO UPDATE SET
            failed_count = login_attempts.failed_count + 1,
            locked_until = CASE
              WHEN login_attempts.failed_count + 1 >= ?
                THEN datetime('now', '+' || ? || ' minutes')
              ELSE NULL
            END,
            updated_at = datetime('now')`,
    args: [username, MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES],
  });
}

export async function clearAttempts(
  db: Client,
  username: string
): Promise<void> {
  await db.execute({
    sql: "DELETE FROM login_attempts WHERE username = ?",
    args: [username],
  });
}
