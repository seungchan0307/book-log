import { getDb, rowsToObjects } from "@/lib/db";
import type { AladinBookResult } from "@/lib/aladin";

type CacheRow = {
  isbn: string;
  title: string;
  author: string | null;
  publisher: string | null;
  cover: string | null;
  description: string | null;
  link: string | null;
  genre: string | null;
};

// Reuses the genre of a book if someone has already registered this exact
// ISBN in our library — Aladin's search API doesn't provide genre itself.
export async function getCachedSearchResults(
  query: string
): Promise<AladinBookResult[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT c.isbn, c.title, c.author, c.publisher, c.cover, c.description, c.link,
                 b.genre AS genre
          FROM aladin_search_cache c
          LEFT JOIN books b ON b.isbn = c.isbn
          WHERE c.title LIKE ?
          ORDER BY c.cached_at DESC
          LIMIT 10`,
    args: [`%${query}%`],
  });

  const rows = rowsToObjects<CacheRow>(result);
  return rows.map((r) => ({
    isbn: r.isbn,
    title: r.title,
    author: r.author,
    publisher: r.publisher,
    cover: r.cover,
    description: r.description,
    link: r.link,
    genre: r.genre,
  }));
}

export async function cacheSearchResults(
  results: AladinBookResult[]
): Promise<void> {
  const items = results.filter((item) => item.isbn);
  if (items.length === 0) return;

  const db = await getDb();
  await db.batch(
    items.map((item) => ({
      sql: `INSERT INTO aladin_search_cache (isbn, title, author, publisher, cover, description, link)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(isbn) DO UPDATE SET
              title = excluded.title,
              author = excluded.author,
              publisher = excluded.publisher,
              cover = excluded.cover,
              description = excluded.description,
              link = excluded.link,
              cached_at = datetime('now')`,
      args: [
        item.isbn,
        item.title,
        item.author,
        item.publisher,
        item.cover,
        item.description,
        item.link,
      ],
    })),
    "write"
  );
}
