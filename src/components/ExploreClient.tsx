"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  findOrCreateBookByIsbn,
  searchAladinForExplore,
} from "@/app/actions/books";
import GenreSelect from "@/components/GenreSelect";
import { StarDisplay } from "@/components/StarRating";
import type { AladinBookResult } from "@/lib/aladin";
import type { BookWithStats } from "@/lib/types";

export default function ExploreClient({ books }: { books: BookWithStats[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");

  const [findQuery, setFindQuery] = useState("");
  const [findResults, setFindResults] = useState<AladinBookResult[]>([]);
  const [findError, setFindError] = useState<string | null>(null);
  const [isFinding, startFind] = useTransition();
  const [openingIsbn, setOpeningIsbn] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      if (genre && b.genre !== genre) return false;
      if (search) {
        const q = search.toLowerCase();
        const inTitle = b.title.toLowerCase().includes(q);
        const inAuthor = (b.author ?? "").toLowerCase().includes(q);
        if (!inTitle && !inAuthor) return false;
      }
      return true;
    });
  }, [books, search, genre]);

  function runFind() {
    setFindError(null);
    startFind(async () => {
      const result = await searchAladinForExplore(findQuery);
      if ("error" in result) {
        setFindError(result.error);
        setFindResults([]);
        return;
      }
      setFindResults(result.results);
    });
  }

  function openResult(book: AladinBookResult) {
    setOpeningIsbn(book.isbn);
    startFind(async () => {
      const result = await findOrCreateBookByIsbn(book);
      setOpeningIsbn(null);
      if ("error" in result) {
        setFindError(result.error);
        return;
      }
      router.push(`/books/${result.bookId}`);
    });
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">탐색</h1>
        <p className="mt-1 text-muted">
          사람들이 남긴 평점으로 새로운 책을 찾아보세요.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
        <span className="text-sm font-medium">탐색하고 싶은 책 찾아보기</span>
        <div className="flex gap-2">
          <input
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runFind();
              }
            }}
            placeholder="책 제목으로 검색"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={runFind}
            disabled={isFinding || !findQuery.trim()}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background disabled:opacity-50"
          >
            {isFinding && !openingIsbn ? "검색 중..." : "검색"}
          </button>
        </div>
        {findError && <p className="text-sm text-red-600">{findError}</p>}
        {findResults.length > 0 && (
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {findResults.map((b) => (
              <li key={b.isbn || b.title}>
                <button
                  type="button"
                  onClick={() => openResult(b)}
                  disabled={isFinding}
                  className="flex w-full gap-2 rounded-md border border-border p-2 text-left hover:bg-background disabled:opacity-50"
                >
                  <div className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-card text-lg text-muted">
                    {b.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.cover}
                        alt={b.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "📖"
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{b.title}</p>
                    <p className="truncate text-xs text-muted">
                      {[b.author, b.publisher].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {openingIsbn === b.isbn && (
                    <span className="ml-auto self-center text-xs text-muted">
                      여는 중...
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="등록된 책을 제목 또는 저자로 검색"
          className="flex-1 min-w-[200px] rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-accent"
        />
        <div className="w-48">
          <GenreSelect
            value={genre}
            onChange={setGenre}
            placeholder="장르로 검색"
            clearLabel="전체 장르"
          />
        </div>
      </div>

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
