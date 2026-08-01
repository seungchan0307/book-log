"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  findOrCreateBookByIsbn,
  recordSearchHistory,
  searchAladinForExplore,
} from "@/app/actions/books";
import BookPosterRow from "@/components/BookPosterRow";
import GenreSelect from "@/components/GenreSelect";
import { StarDisplay } from "@/components/StarRating";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { AladinBookResult } from "@/lib/aladin";
import type { BookWithStats } from "@/lib/types";

type SortMode = "relevance" | "rating" | "recent";

const SORT_LABELS: Record<SortMode, string> = {
  relevance: "관련도순",
  rating: "평점순",
  recent: "최신순",
};

function isInMyLibrary(book: BookWithStats): boolean {
  return book.my_reading_status !== null || book.my_rating !== null;
}

function relevanceScore(book: BookWithStats, query: string): number {
  const q = query.toLowerCase();
  const title = book.title.toLowerCase();
  const author = (book.author ?? "").toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (author.includes(q)) return 40;
  return 0;
}

export default function ExploreClient({
  books,
  recentlyAdded,
  recentSearches,
  isLoggedIn,
}: {
  books: BookWithStats[];
  recentlyAdded: BookWithStats[];
  recentSearches: BookWithStats[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [hideOwned, setHideOwned] = useState(false);
  const [aladinResults, setAladinResults] = useState<AladinBookResult[]>([]);
  const [aladinError, setAladinError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [openingIsbn, setOpeningIsbn] = useState<string | null>(null);

  function visitBook(bookId: number) {
    if (search.trim()) {
      recordSearchHistory(bookId).catch(() => {});
    }
  }

  // Already-registered books filter live as you type; searching the wider
  // Aladin catalog needs a network call, debounced off the same search box.
  const matched = useMemo(() => {
    return books.filter((b) => {
      if (b.avg_rating === null) return false;
      if (genre && b.genre !== genre) return false;
      if (hideOwned && isInMyLibrary(b)) return false;
      if (search) {
        const q = search.toLowerCase();
        const inTitle = b.title.toLowerCase().includes(q);
        const inAuthor = (b.author ?? "").toLowerCase().includes(q);
        if (!inTitle && !inAuthor) return false;
      }
      return true;
    });
  }, [books, search, genre, hideOwned]);

  const sorted = useMemo(() => {
    const list = [...matched];
    if (sortMode === "rating") {
      list.sort(
        (a, b) =>
          (b.avg_rating ?? -1) - (a.avg_rating ?? -1) ||
          b.review_count - a.review_count
      );
    } else if (sortMode === "recent") {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (search) {
      list.sort(
        (a, b) =>
          relevanceScore(b, search) - relevanceScore(a, search) ||
          b.view_count - a.view_count
      );
    } else {
      list.sort(
        (a, b) => b.view_count - a.view_count || b.review_count - a.review_count
      );
    }
    return list;
  }, [matched, sortMode, search]);

  const debouncedSearch = useDebouncedValue(search, 400);
  useEffect(() => {
    startSearch(async () => {
      const q = debouncedSearch.trim();
      if (!q) {
        setAladinResults([]);
        setAladinError(null);
        return;
      }
      const result = await searchAladinForExplore(debouncedSearch);
      if ("error" in result) {
        setAladinError(result.error);
        setAladinResults([]);
        return;
      }
      setAladinError(null);
      setAladinResults(result.results);
    });
  }, [debouncedSearch]);

  function openResult(book: AladinBookResult) {
    setOpeningIsbn(book.isbn);
    startSearch(async () => {
      const result = await findOrCreateBookByIsbn(book);
      setOpeningIsbn(null);
      if ("error" in result) {
        setAladinError(result.error);
        return;
      }
      visitBook(result.bookId);
      router.push(`/books/${result.bookId}`);
    });
  }

  const showDiscoveryRows = !search;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">탐색</h1>
        <p className="mt-1 text-muted">
          사람들이 남긴 평점으로 새로운 책을 찾아보세요.
        </p>
      </div>

      {showDiscoveryRows && isLoggedIn && recentSearches.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">최근 검색한 책</h2>
          <BookPosterRow
            books={recentSearches}
            metric={(book) => (
              <StarDisplay rating={book.avg_rating} size="text-sm" />
            )}
          />
        </section>
      )}

      {showDiscoveryRows && recentlyAdded.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">최근 등록된 책</h2>
          <BookPosterRow
            books={recentlyAdded}
            metric={(book) => (
              <StarDisplay rating={book.avg_rating} size="text-sm" />
            )}
          />
        </section>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목 또는 저자로 검색"
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 text-sm">
            {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                className={`rounded-md border px-3 py-1 ${
                  sortMode === mode
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border hover:bg-card"
                }`}
              >
                {SORT_LABELS[mode]}
              </button>
            ))}
          </div>
          {isLoggedIn && (
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input
                type="checkbox"
                checked={hideOwned}
                onChange={(e) => setHideOwned(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              내 서재에 있는 책 숨기기
            </label>
          )}
        </div>
      </div>

      {isSearching && !openingIsbn && (
        <p className="text-xs text-muted">검색 중...</p>
      )}
      {aladinError && <p className="text-sm text-red-600">{aladinError}</p>}
      {aladinResults.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted">
            아직 등록되지 않은 책
          </span>
          <ul className="flex flex-col gap-2">
            {aladinResults.map((b) => (
              <li key={b.isbn || b.title}>
                <button
                  type="button"
                  onClick={() => openResult(b)}
                  disabled={isSearching}
                  className="flex w-full gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-accent disabled:opacity-50"
                >
                  <div className="relative flex h-16 w-11 shrink-0 items-center justify-center overflow-hidden rounded bg-background text-lg text-muted">
                    {b.cover ? (
                      <Image
                        src={b.cover}
                        alt={b.title}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      "📖"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.title}</p>
                    <p className="truncate text-xs text-muted">
                      {[b.author, b.publisher].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {openingIsbn === b.isbn && (
                    <span className="self-center text-xs text-muted">
                      여는 중...
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          {books.length === 0
            ? "아직 등록된 책이 없어요."
            : "조건에 맞는 책이 없어요."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              onClick={() => visitBook(book.id)}
              className="flex gap-3 rounded-lg border border-border bg-card p-4 hover:border-accent"
            >
              <div className="relative flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-background text-2xl text-muted">
                {book.cover_url ? (
                  <Image
                    src={book.cover_url}
                    alt={book.title}
                    fill
                    sizes="64px"
                    className="object-cover"
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
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {book.genre && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                        {book.genre}
                      </span>
                    )}
                    {isInMyLibrary(book) && (
                      <span className="rounded-full border border-accent px-2 py-0.5 text-xs text-accent">
                        내 서재에 있음
                      </span>
                    )}
                  </div>
                </div>
                <StarDisplay rating={book.avg_rating} />
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
