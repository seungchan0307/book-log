"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rollItem, type GachaItem } from "@/lib/gacha";

export type PullGachaResult = { error: string } | { item: GachaItem };

export async function pullGacha(): Promise<PullGachaResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const db = await getDb();
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
