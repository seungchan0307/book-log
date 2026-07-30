export type AladinBookResult = {
  isbn: string;
  title: string;
  author: string | null;
  publisher: string | null;
  cover: string | null;
  description: string | null;
  link: string | null;
  // Aladin's basic search doesn't return a genre. This is only ever filled
  // in from our own DB when we've seen this ISBN registered before.
  genre: string | null;
};

type AladinApiItem = {
  isbn13?: string;
  isbn?: string;
  title?: string;
  author?: string;
  publisher?: string;
  cover?: string;
  description?: string;
  link?: string;
};

const ALADIN_ITEM_SEARCH_URL = "http://www.aladin.co.kr/ttb/api/ItemSearch.aspx";

export async function searchAladin(query: string): Promise<AladinBookResult[]> {
  const ttbKey = process.env.ALADIN_TTB_KEY;
  if (!ttbKey) {
    throw new Error(
      "알라딘 API 키가 설정되지 않았어요. .env.local에 ALADIN_TTB_KEY를 추가해주세요."
    );
  }

  const url = new URL(ALADIN_ITEM_SEARCH_URL);
  url.searchParams.set("ttbkey", ttbKey);
  url.searchParams.set("Query", query);
  url.searchParams.set("QueryType", "Keyword");
  url.searchParams.set("MaxResults", "10");
  url.searchParams.set("start", "1");
  url.searchParams.set("SearchTarget", "Book");
  url.searchParams.set("output", "js");
  url.searchParams.set("Version", "20131101");
  url.searchParams.set("Cover", "Big");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error("알라딘 검색 요청에 실패했어요.");
  }

  const data = (await res.json()) as { item?: AladinApiItem[]; errorMessage?: string };
  if (data.errorMessage) {
    throw new Error(data.errorMessage);
  }

  const items = data.item ?? [];
  return items.map((item) => ({
    isbn: item.isbn13 || item.isbn || "",
    title: item.title ?? "",
    author: item.author ?? null,
    publisher: item.publisher ?? null,
    cover: item.cover ?? null,
    description: item.description ?? null,
    link: item.link ?? null,
    genre: null,
  }));
}
