"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StarDisplay } from "@/components/StarRating";
import type { BookWithStats } from "@/lib/types";

export default function ExploreClient({ books }: { books: BookWithStats[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BookWithStats | null>(null);

  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return books
      .filter((b) => {
        const inTitle = b.title.toLowerCase().includes(q);
        const inAuthor = (b.author ?? "").toLowerCase().includes(q);
        return inTitle || inAuthor;
      })
      .slice(0, 8);
  }, [books, search]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">탐색</h1>
        <p className="mt-1 text-muted">
          책을 검색해서 저자, 줄거리, 평점, 탐색 횟수를 확인해보세요.
        </p>
      </div>

      <div className="relative">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelected(null);
          }}
          placeholder="제목 또는 저자로 책 검색"
          className="w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-accent"
        />
        {search && !selected && (
          <ul className="absolute z-10 mt-1 flex max-h-72 w-full flex-col gap-1 overflow-y-auto rounded-md border border-border bg-card p-2 shadow-lg">
            {filtered.length === 0 ? (
              <li className="p-2 text-sm text-muted">검색 결과가 없어요.</li>
            ) : (
              filtered.map((book) => (
                <li key={book.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(book);
                      setSearch(book.title);
                    }}
                    className="flex w-full gap-2 rounded-md p-2 text-left hover:bg-background"
                  >
                    <div className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-background text-lg text-muted">
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
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {book.title}
                      </p>
                      {book.author && (
                        <p className="truncate text-xs text-muted">
                          {book.author}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {selected && (
        <div className="flex gap-4 rounded-lg border border-border bg-card p-4">
          <Link
            href={`/books/${selected.id}`}
            className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded bg-background text-2xl text-muted"
          >
            {selected.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.cover_url}
                alt={selected.title}
                className="h-full w-full object-cover"
              />
            ) : (
              "📖"
            )}
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/books/${selected.id}`}
                  className="hover:underline"
                >
                  <h3 className="font-semibold">{selected.title}</h3>
                </Link>
                {selected.author && (
                  <p className="text-sm text-muted">{selected.author}</p>
                )}
              </div>
              {selected.genre && (
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                  {selected.genre}
                </span>
              )}
            </div>
            {selected.description && (
              <p className="whitespace-pre-wrap text-sm text-muted">
                {selected.description}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <StarDisplay
                rating={selected.avg_rating}
                reviewCount={selected.review_count}
              />
              <span className="text-xs text-muted">
                탐색 {selected.view_count}회
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
