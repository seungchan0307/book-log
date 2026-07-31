"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StarDisplay } from "@/components/StarRating";
import type { BookWithStats } from "@/lib/types";

export default function ExploreClient({ books }: { books: BookWithStats[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return books;
    const q = search.toLowerCase();
    return books.filter((b) => {
      const inTitle = b.title.toLowerCase().includes(q);
      const inAuthor = (b.author ?? "").toLowerCase().includes(q);
      return inTitle || inAuthor;
    });
  }, [books, search]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">탐색</h1>
        <p className="mt-1 text-muted">
          사람들이 남긴 평점으로 새로운 책을 찾아보세요.
        </p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="제목 또는 저자로 검색"
        className="w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-accent"
      />

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          {books.length === 0
            ? "아직 등록된 책이 없어요."
            : "조건에 맞는 책이 없어요."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="flex gap-3 rounded-lg border border-border bg-card p-4 hover:border-accent"
            >
              <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-background text-2xl text-muted">
                {book.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "📖"
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{book.title}</h3>
                    {book.author && (
                      <p className="truncate text-sm text-muted">
                        {book.author}
                      </p>
                    )}
                  </div>
                  {book.genre && (
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                      {book.genre}
                    </span>
                  )}
                </div>
                <StarDisplay
                  rating={book.avg_rating}
                  reviewCount={book.review_count}
                />
                <span className="text-xs text-muted">
                  탐색 {book.view_count}회
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
