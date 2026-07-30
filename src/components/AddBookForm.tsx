"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addBook,
  searchAladinBooks,
  type BookFormState,
} from "@/app/actions/books";
import { GENRES } from "@/lib/genres";
import type { AladinBookResult } from "@/lib/aladin";

const initialState: BookFormState = {};

const emptyFields = {
  title: "",
  author: "",
  genre: "",
  coverUrl: "",
  description: "",
  purchaseUrl: "",
  isbn: "",
};

export default function AddBookForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addBook, initialState);
  const [handledState, setHandledState] = useState(state);

  const [fields, setFields] = useState(emptyFields);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AladinBookResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();

  // Closing on success clears the form fields for next time.
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      setOpen(false);
      setFields(emptyFields);
      setSearchResults([]);
      setSearchQuery("");
    }
  }

  function runSearch() {
    setSearchError(null);
    startSearch(async () => {
      const result = await searchAladinBooks(searchQuery);
      if ("error" in result) {
        setSearchError(result.error);
        setSearchResults([]);
        return;
      }
      setSearchResults(result.results);
    });
  }

  function pickResult(book: AladinBookResult) {
    // Only the cover image (and its purchase link/ISBN) come from the search
    // pick; title/author/description stay whatever the user already typed.
    // Genre is only set if we already know it from a prior registration of
    // this exact ISBN — Aladin's search itself doesn't provide genre.
    setFields((prev) => ({
      ...prev,
      coverUrl: book.cover ?? prev.coverUrl,
      purchaseUrl: book.link ?? prev.purchaseUrl,
      isbn: book.isbn || prev.isbn,
      genre: book.genre ?? prev.genre,
    }));
    setSearchResults([]);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90"
      >
        + 책 등록하기
      </button>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">새 책 등록</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-muted hover:text-foreground"
        >
          닫기
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
        <span className="text-sm font-medium">책 찾기</span>
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runSearch();
              }
            }}
            placeholder="책 제목으로 검색"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={runSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background disabled:opacity-50"
          >
            {isSearching ? "검색 중..." : "검색"}
          </button>
        </div>
        {searchError && <p className="text-sm text-red-600">{searchError}</p>}
        {searchResults.length > 0 && (
          <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
            {searchResults.map((b) => (
              <li key={b.isbn || b.title}>
                <button
                  type="button"
                  onClick={() => pickResult(b)}
                  className="flex w-full gap-2 rounded-md border border-border p-2 text-left hover:bg-background"
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
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input type="hidden" name="purchase_url" value={fields.purchaseUrl} />
      <input type="hidden" name="isbn" value={fields.isbn} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="title" className="text-sm font-medium">
            제목 *
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            value={fields.title}
            onChange={(e) => setFields({ ...fields, title: e.target.value })}
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="author" className="text-sm font-medium">
            저자
          </label>
          <input
            id="author"
            name="author"
            value={fields.author}
            onChange={(e) => setFields({ ...fields, author: e.target.value })}
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="genre" className="text-sm font-medium">
            장르
          </label>
          <select
            id="genre"
            name="genre"
            value={fields.genre}
            onChange={(e) => setFields({ ...fields, genre: e.target.value })}
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          >
            <option value="">선택 안 함</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="cover_url" className="text-sm font-medium">
            표지 이미지 URL
          </label>
          <input
            id="cover_url"
            name="cover_url"
            placeholder="https://..."
            value={fields.coverUrl}
            onChange={(e) =>
              setFields({ ...fields, coverUrl: e.target.value })
            }
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="description" className="text-sm font-medium">
            책 소개
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            value={fields.description}
            onChange={(e) =>
              setFields({ ...fields, description: e.target.value })
            }
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
        </div>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "등록 중..." : "등록"}
      </button>
    </form>
  );
}
