"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addBookWithReview,
  searchAladinBooks,
  type BookFormState,
} from "@/app/actions/books";
import { GENRES } from "@/lib/genres";
import GenreSelect from "@/components/GenreSelect";
import { StarPicker } from "@/components/StarRating";
import type { AladinBookResult } from "@/lib/aladin";

const initialState: BookFormState = {};

const emptyFields = {
  title: "",
  author: "",
  coverUrl: "",
  purchaseUrl: "",
  isbn: "",
};

export default function AddBookForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    addBookWithReview,
    initialState
  );
  const [handledState, setHandledState] = useState(state);

  const [fields, setFields] = useState(emptyFields);
  const [genreChoice, setGenreChoice] = useState("");
  const [customGenre, setCustomGenre] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AladinBookResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  // Bumping this key remounts the form (and StarPicker inside it) so a
  // successful submit clears the rating/review, not just the text fields.
  const [resetKey, setResetKey] = useState(0);

  // Closing on success clears the form fields for next time.
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      setOpen(false);
      setFields(emptyFields);
      setGenreChoice("");
      setCustomGenre("");
      setSearchResults([]);
      setSearchQuery("");
      setResetKey((k) => k + 1);
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
    setFields({
      title: book.title,
      author: book.author ?? "",
      coverUrl: book.cover ?? "",
      purchaseUrl: book.link ?? "",
      isbn: book.isbn || "",
    });
    const g = book.genre ?? "";
    if (g && !(GENRES as readonly string[]).includes(g)) {
      setGenreChoice("기타");
      setCustomGenre(g);
    } else {
      setGenreChoice(g);
      setCustomGenre("");
    }
    setSearchResults([]);
  }

  const resolvedGenre =
    genreChoice === "기타" ? customGenre.trim() : genreChoice;

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
      key={resetKey}
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
        <p className="text-xs text-muted">
          책을 선택하면 제목/저자가 자동으로 채워져요. 찾는 책이 없다면 검색
          없이 아래에 직접 입력할 수 있어요.
        </p>
      </div>

      <input type="hidden" name="purchase_url" value={fields.purchaseUrl} />
      <input type="hidden" name="isbn" value={fields.isbn} />
      <input type="hidden" name="cover_url" value={fields.coverUrl} />

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
          <input type="hidden" name="genre" value={resolvedGenre} />
          <GenreSelect value={genreChoice} onChange={setGenreChoice} />
          {genreChoice === "기타" && (
            <input
              value={customGenre}
              onChange={(e) => setCustomGenre(e.target.value)}
              maxLength={20}
              placeholder="원하는 장르를 직접 입력해주세요"
              className="mt-1 rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-3">
        <div>
          <span className="mb-1 block text-sm font-medium">평점</span>
          <StarPicker name="rating" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="content" className="text-sm font-medium">
            감상평 (선택)
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            placeholder="감상평 없이 평점만 남겨도 돼요"
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_public"
            defaultChecked
            className="h-4 w-4 accent-accent"
          />
          다른 사람에게 감상평 공개하기
        </label>
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
