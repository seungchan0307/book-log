"use server";

import { revalidatePath } from "next/cache";
import { getDb, rowsToObjects } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { LOOKS_LIKE_A_BOOK_WHERE } from "@/lib/data";
import {
  RARITY_RANK,
  ROW_COST_TOKENS,
  SHELF_ROW_SIZE,
  rollRarity,
  type Rarity,
} from "@/lib/gacha";

type PulledBook = {
  id: number;
  title: string;
  author: string | null;
  cover_url: string | null;
};

export type PullGachaResult =
  | { error: string }
  | {
      book: PulledBook;
      rarity: Rarity;
      // duplicate: this book was already on the shelf. upgraded: the new
      // copy's rarity beat the old one, so it replaced it in place —
      // otherwise the shelf is unchanged (the pull still spends the ticket).
      duplicate: boolean;
      upgraded: boolean;
      previousRarity: Rarity | null;
    };

export async function pullGacha(): Promise<PullGachaResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const db = await getDb();

  const ticket = await db.execute({
    sql: `SELECT id FROM gacha_tickets
          WHERE user_id = ? AND used_at IS NULL
          ORDER BY id ASC LIMIT 1`,
    args: [user.id],
  });
  const ticketRow = ticket.rows[0] as unknown as { id: number } | undefined;
  if (!ticketRow) {
    return { error: "뽑기권이 없어요. 책을 다 읽으면 뽑기권을 받을 수 있어요." };
  }

  // The prize is a real book picked at random from the whole catalog —
  // rarity (rolled separately, below) only decides how fancy this
  // particular copy is, not which book you get.
  const bookResult = await db.execute({
    sql: `SELECT id, title, author, cover_url FROM books b
          WHERE ${LOOKS_LIKE_A_BOOK_WHERE}
          ORDER BY RANDOM() LIMIT 1`,
    args: [],
  });
  // libsql Row objects are array-like with getters, not plain objects, so
  // they can't be returned from a Server Action as-is (Next.js rejects
  // non-plain objects crossing the server/client boundary) — rowsToObjects
  // converts it to a genuine plain object first.
  const book = rowsToObjects<PulledBook>(bookResult)[0];
  if (!book) {
    return { error: "아직 뽑을 수 있는 책이 없어요." };
  }

  const rarity = rollRarity();

  const existing = await db.execute({
    sql: "SELECT id, rarity FROM bookshelf_items WHERE user_id = ? AND book_id = ?",
    args: [user.id, book.id],
  });
  const existingRow = existing.rows[0] as unknown as
    | { id: number; rarity: Rarity }
    | undefined;

  if (existingRow) {
    // Duplicate: only touches the shelf (no new slot needed) if the new
    // copy outranks the one already there — same row, same slot, so it
    // "꽂아지는" in place rather than jumping to the end of the shelf.
    const upgraded = RARITY_RANK[rarity] > RARITY_RANK[existingRow.rarity];
    const statements: { sql: string; args: (string | number)[] }[] = [
      {
        sql: "UPDATE gacha_tickets SET used_at = datetime('now') WHERE id = ?",
        args: [ticketRow.id],
      },
    ];
    if (upgraded) {
      statements.push({
        sql: "UPDATE bookshelf_items SET rarity = ?, item_key = ? WHERE id = ?",
        args: [rarity, book.title, existingRow.id],
      });
    }
    await db.batch(statements, "write");

    revalidatePath("/bookshelf");
    revalidatePath("/library");
    return {
      book,
      rarity,
      duplicate: true,
      upgraded,
      previousRarity: existingRow.rarity,
    };
  }

  // New book — gated by shelf capacity (checked here, not up front, since
  // a duplicate never needs a free slot to land in).
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

  await db.batch(
    [
      {
        sql: "UPDATE gacha_tickets SET used_at = datetime('now') WHERE id = ?",
        args: [ticketRow.id],
      },
      {
        sql: `INSERT INTO bookshelf_items (user_id, book_id, item_key, rarity)
              VALUES (?, ?, ?, ?)`,
        args: [user.id, book.id, book.title, rarity],
      },
    ],
    "write"
  );

  revalidatePath("/bookshelf");
  revalidatePath("/library");
  revalidatePath("/profile");
  return { book, rarity, duplicate: false, upgraded: false, previousRarity: null };
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
