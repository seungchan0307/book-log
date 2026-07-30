import db from "@/lib/db";
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
export function getCachedSearchResults(query: string): AladinBookResult[] {
  const rows = db
    .prepare(
      `SELECT c.isbn, c.title, c.author, c.publisher, c.cover, c.description, c.link,
              b.genre AS genre
       FROM aladin_search_cache c
       LEFT JOIN books b ON b.isbn = c.isbn
       WHERE c.title LIKE ?
       ORDER BY c.cached_at DESC
       LIMIT 10`
    )
    .all(`%${query}%`) as CacheRow[];

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

export function cacheSearchResults(results: AladinBookResult[]): void {
  const upsert = db.prepare(
    `INSERT INTO aladin_search_cache (isbn, title, author, publisher, cover, description, link)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(isbn) DO UPDATE SET
       title = excluded.title,
       author = excluded.author,
       publisher = excluded.publisher,
       cover = excluded.cover,
       description = excluded.description,
       link = excluded.link,
       cached_at = datetime('now')`
  );

  const insertMany = db.transaction((items: AladinBookResult[]) => {
    for (const item of items) {
      if (!item.isbn) continue;
      upsert.run(
        item.isbn,
        item.title,
        item.author,
        item.publisher,
        item.cover,
        item.description,
        item.link
      );
    }
  });

  insertMany(results);
}
