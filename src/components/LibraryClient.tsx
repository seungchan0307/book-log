"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AddBookForm from "@/components/AddBookForm";
import BookCard from "@/components/BookCard";
import ReviewModal from "@/components/ReviewModal";
import { StarDisplay } from "@/components/StarRating";
import { deleteReview } from "@/app/actions/reviews";
import { GENRES } from "@/lib/genres";
import type { BookWithStats, ReviewWithBook } from "@/lib/types";

export default function LibraryClient({
  books,
  myReviews,
  isLoggedIn,
}: {
  books: BookWithStats[];
  myReviews: ReviewWithBook[];
  isLoggedIn: boolean;
}) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [reviewTarget, setReviewTarget] = useState<BookWithStats | null>(
    null
  );
  const [pickedCover, setPickedCover] = useState<string | null>(null);

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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-stretch justify-between gap-3">
        <h1 className="shrink-0 self-center text-2xl font-bold">서재</h1>
        {pickedCover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pickedCover}
            alt="선택한 책 표지"
            className="min-h-40 min-w-0 flex-1 rounded-md object-cover shadow-md"
          />
        )}
        {isLoggedIn ? (
          <AddBookForm onCoverChange={setPickedCover} />
        ) : (
          <p className="text-sm text-muted">
            로그인하면 책을 등록하고 감상을 남길 수 있어요.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="제목 또는 저자로 검색"
          className="flex-1 min-w-[200px] rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-accent"
        />
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-accent"
        >
          <option value="">전체 장르</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          {books.length === 0
            ? "아직 등록된 책이 없어요. 첫 책을 등록해보세요!"
            : "조건에 맞는 책이 없어요."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isLoggedIn={isLoggedIn}
              onReview={setReviewTarget}
            />
          ))}
        </div>
      )}

      {isLoggedIn && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">내가 남긴 감상</h2>
          {myReviews.length === 0 ? (
            <p className="text-muted">아직 남긴 감상이 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {myReviews.map((r) => (
                <li
                  key={r.id}
                  className="flex gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <Link
                    href={`/books/${r.book_id}`}
                    className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-background text-xl text-muted"
                  >
                    {r.book_cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.book_cover_url}
                        alt={r.book_title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "📖"
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-medium">{r.book_title}</span>
                        {r.book_author && (
                          <span className="ml-2 text-sm text-muted">
                            {r.book_author}
                          </span>
                        )}
                      </div>
                      <StarDisplay rating={r.rating} />
                    </div>
                    {r.content && (
                      <p className="whitespace-pre-wrap text-sm">
                        {r.content}
                      </p>
                    )}
                    <form action={deleteReview} className="self-start">
                      <input type="hidden" name="review_id" value={r.id} />
                      <button
                        type="submit"
                        className="text-xs text-muted hover:text-red-600"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          book={reviewTarget}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}
