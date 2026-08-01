"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
  addBookWithReview,
  searchAladinBooks,
  type BookFormState,
} from "@/app/actions/books";
import { GENRES } from "@/lib/genres";
import GenreSelect from "@/components/GenreSelect";
import { StarPicker } from "@/components/StarRating";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { AladinBookResult } from "@/lib/aladin";

const initialState: BookFormState = {};

const emptyFields = {
  title: "",
  author: "",
  coverUrl: "",
  purchaseUrl: "",
  isbn: "",
};

type ReadingStatus = "finished" | "reading" | "want_to_read";

const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  finished: "다 읽음",
  reading: "읽는 중",
  want_to_read: "읽을 예정",
};

export default function AddBookForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
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
  const [clientError, setClientError] = useState<string | null>(null);
  const [readingStatus, setReadingStatusState] =
    useState<ReadingStatus>("finished");
  const [wantsReviewWhileReading, setWantsReviewWhileReading] =
    useState(false);

  function setReadingStatus(status: ReadingStatus) {
    setReadingStatusState(status);
    setWantsReviewWhileReading(false);
  }

  // finished always shows the review section; reading only shows it once
  // the user opts in via the "그래도 감상평을 남기시겠어요?" checkbox;
  // want_to_read never does (nothing to review yet).
  const showReviewSection =
    readingStatus === "finished" ||
    (readingStatus === "reading" && wantsReviewWhileReading);

  // Clearing the form fields is this component's own state, adjusted during
  // its own render. Closing the panel is a side effect on the parent, so
  // that part has to run in an effect instead.
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      setFields(emptyFields);
      setGenreChoice("");
      setCustomGenre("");
      setSearchResults([]);
      setSearchQuery("");
      setReadingStatus("finished");
      setResetKey((k) => k + 1);
    }
  }

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  // Live search: results update as the user types, debounced so every
  // keystroke doesn't fire its own request.
  const debouncedQuery = useDebouncedValue(searchQuery, 400);
  useEffect(() => {
    startSearch(async () => {
      const q = debouncedQuery.trim();
      if (!q) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }
      const result = await searchAladinBooks(debouncedQuery);
      if ("error" in result) {
        setSearchError(result.error);
        setSearchResults([]);
        return;
      }
      setSearchError(null);
      setSearchResults(result.results);
    });
  }, [debouncedQuery]);

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

  return (
    <form
      key={resetKey}
      action={action}
      onSubmit={(e) => {
        if (!resolvedGenre) {
          e.preventDefault();
          setClientError("장르를 선택하거나 직접 입력해주세요.");
          return;
        }
        if (showReviewSection) {
          const rating = Number(new FormData(e.currentTarget).get("rating"));
          if (!rating || rating <= 0) {
            e.preventDefault();
            setClientError("평점을 선택해주세요.");
            return;
          }
        }
        setClientError(null);
      }}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">새 책 등록</h3>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-sm text-muted hover:text-foreground"
        >
          나의 서재로 돌아가기
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
        <span className="text-sm font-medium">책 찾기</span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="책 제목으로 검색"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {isSearching && <p className="text-xs text-muted">검색 중...</p>}
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
                  <div className="relative flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-card text-lg text-muted">
                    {b.cover ? (
                      <Image
                        src={b.cover}
                        alt={b.title}
                        fill
                        sizes="40px"
                        className="object-cover"
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
            장르 *
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

      <div className="flex flex-col gap-1 border-t border-border pt-3">
        <span className="text-sm font-medium">읽기 상태 *</span>
        <input type="hidden" name="reading_status" value={readingStatus} />
        <div className="flex gap-2">
          {(Object.keys(READING_STATUS_LABELS) as ReadingStatus[]).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setReadingStatus(status)}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  readingStatus === status
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border hover:bg-background"
                }`}
              >
                {READING_STATUS_LABELS[status]}
              </button>
            )
          )}
        </div>
      </div>

      {readingStatus === "reading" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={wantsReviewWhileReading}
            onChange={(e) => setWantsReviewWhileReading(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          아직 읽는 중이신데, 그래도 감상평을 남기시겠어요?
        </label>
      )}

      {showReviewSection && (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div>
            <span className="mb-1 block text-sm font-medium">평점 *</span>
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_anonymous"
              className="h-4 w-4 accent-accent"
            />
            익명으로 작성하기 (닉네임 대신 &quot;익명&quot;으로 표시돼요)
          </label>
        </div>
      )}

      {(clientError || state.error) && (
        <p className="text-sm text-red-600">{clientError || state.error}</p>
      )}
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
