"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  rollItem,
  ROW_COST_TOKENS,
  SHELF_ROW_SIZE,
  type GachaItem,
} from "@/lib/gacha";

export type PullGachaResult = { error: string } | { item: GachaItem };

export async function pullGacha(): Promise<PullGachaResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const db = await getDb();

  // Shelf capacity gates the pull itself (checked before spending the
  // ticket) so a full shelf doesn't burn a ticket the item has nowhere to
  // go — the ticket stays available until the user buys another row.
  const meta = await db.execute({
    sql: "SELECT bookshelf_rows FROM users WHERE id = ?",
    args: [user.id],
  });
  const bookshelfRows =
    (meta.rows[0] as unknown as { bookshelf_rows: number } | undefined)
      ?.bookshelf_rows ?? 1;
  const countResult = await db.execute({
    sql: "SELECT COUNT(*) AS count FROM bookshelf_items WHERE user_id = ?",
    args: [user.id],
  });
  const itemCount = (
    countResult.rows[0] as unknown as { count: number }
  ).count;
  if (itemCount >= bookshelfRows * SHELF_ROW_SIZE) {
    return {
      error: "책장이 가득 찼어요. 책갈피 토큰으로 칸을 늘려주세요.",
    };
  }

  const ticket = await db.execute({
    sql: `SELECT id, book_id FROM gacha_tickets
          WHERE user_id = ? AND used_at IS NULL
          ORDER BY id ASC LIMIT 1`,
    args: [user.id],
  });
  const ticketRow = ticket.rows[0] as unknown as
    | { id: number; book_id: number | null }
    | undefined;
  if (!ticketRow) {
    return { error: "뽑기권이 없어요. 책을 다 읽으면 뽑기권을 받을 수 있어요." };
  }

  const item = rollItem();

  // Spend the ticket and record the pull together — a ticket that's marked
  // used but never produced an item (or vice versa) would silently break
  // both "책장에 순서대로 정렬" and the count shown on the pull button.
  await db.batch(
    [
      {
        sql: "UPDATE gacha_tickets SET used_at = datetime('now') WHERE id = ?",
        args: [ticketRow.id],
      },
      {
        sql: `INSERT INTO bookshelf_items (user_id, book_id, item_key, rarity)
              VALUES (?, ?, ?, ?)`,
        args: [user.id, ticketRow.book_id, item.key, item.rarity],
      },
    ],
    "write"
  );

  revalidatePath("/bookshelf");
  revalidatePath("/library");
  revalidatePath("/profile");
  return { item };
}

export type BuyBookshelfRowResult =
  | { error: string }
  | { success: true; bookshelfRows: number; bookmarkTokens: number };

export async function buyBookshelfRow(): Promise<BuyBookshelfRowResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT bookmark_tokens, bookshelf_rows FROM users WHERE id = ?",
    args: [user.id],
  });
  const row = result.rows[0] as unknown as
    | { bookmark_tokens: number; bookshelf_rows: number }
    | undefined;
  if (!row || row.bookmark_tokens < ROW_COST_TOKENS) {
    return {
      error: `책갈피 토큰이 부족해요. (${ROW_COST_TOKENS}개 필요, 보유 ${row?.bookmark_tokens ?? 0}개)`,
    };
  }

  const bookmarkTokens = row.bookmark_tokens - ROW_COST_TOKENS;
  const bookshelfRows = row.bookshelf_rows + 1;
  await db.execute({
    sql: "UPDATE users SET bookmark_tokens = ?, bookshelf_rows = ? WHERE id = ?",
    args: [bookmarkTokens, bookshelfRows, user.id],
  });

  revalidatePath("/bookshelf");
  revalidatePath("/library");
  return { success: true, bookshelfRows, bookmarkTokens };
}
