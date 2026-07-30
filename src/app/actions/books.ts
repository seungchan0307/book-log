"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { GENRES } from "@/lib/genres";
import { searchAladin, type AladinBookResult } from "@/lib/aladin";
import { getCachedSearchResults, cacheSearchResults } from "@/lib/bookCache";

export type BookFormState = { error?: string; success?: boolean };

export type AladinSearchState =
  | { results: AladinBookResult[] }
  | { error: string };

export async function searchAladinBooks(
  query: string
): Promise<AladinSearchState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return { error: "검색어를 입력해주세요." };
  }

  const cached = await getCachedSearchResults(trimmed);
  if (cached.length > 0) {
    return { results: cached };
  }

  try {
    const results = await searchAladin(trimmed);
    await cacheSearchResults(results);
    return { results };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "검색 중 오류가 발생했어요.",
    };
  }
}

export async function addBook(
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim();
  const coverUrl = String(formData.get("cover_url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const purchaseUrl = String(formData.get("purchase_url") ?? "").trim();
  const isbn = String(formData.get("isbn") ?? "").trim();

  if (title.length < 1 || title.length > 200) {
    return { error: "제목을 1~200자로 입력해주세요." };
  }
  if (genre && !(GENRES as readonly string[]).includes(genre)) {
    return { error: "올바른 장르를 선택해주세요." };
  }
  if (coverUrl && !/^https?:\/\//.test(coverUrl)) {
    return { error: "표지 URL은 http(s)로 시작해야 합니다." };
  }
  if (purchaseUrl && !/^https?:\/\//.test(purchaseUrl)) {
    return { error: "구매 링크는 http(s)로 시작해야 합니다." };
  }

  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO books (title, author, genre, cover_url, description, purchase_url, isbn, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      title,
      author || null,
      genre || null,
      coverUrl || null,
      description || null,
      purchaseUrl || null,
      isbn || null,
      user.id,
    ],
  });

  revalidatePath("/library");
  revalidatePath("/recommend");
  return { success: true };
}
