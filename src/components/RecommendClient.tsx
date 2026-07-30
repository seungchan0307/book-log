"use client";

import { useState } from "react";
import Link from "next/link";
import BookCard from "@/components/BookCard";
import ReviewModal from "@/components/ReviewModal";
import { StarDisplay } from "@/components/StarRating";
import type { BookWithStats, PopularReview } from "@/lib/types";

function BookGrid({
  books,
  isLoggedIn,
  onReview,
}: {
  books: BookWithStats[];
  isLoggedIn: boolean;
  onReview: (book: BookWithStats) => void;
}) {
  if (books.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
        아직 보여줄 책이 없어요.
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          isLoggedIn={isLoggedIn}
          onReview={onReview}
        />
      ))}
    </div>
  );
}

function PopularReviewList({ reviews }: { reviews: PopularReview[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
        아직 보여줄 감상평이 없어요.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {reviews.map((r) => (
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/books/${r.book_id}`} className="hover:underline">
                  <span className="font-medium">{r.book_title}</span>
                </Link>
                {r.book_author && (
                  <span className="ml-2 text-sm text-muted">
                    {r.book_author}
                  </span>
                )}
              </div>
              <StarDisplay rating={r.rating} />
            </div>
            {r.content && (
              <p className="whitespace-pre-wrap text-sm">{r.content}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>{r.reviewer_nickname}</span>
              <span>·</span>
              <span>탐색 {r.book_view_count}회</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function RecommendClient({
  popularReviews,
  personalized,
  isLoggedIn,
  hasFavoriteGenres,
}: {
  popularReviews: PopularReview[];
  personalized: BookWithStats[];
  isLoggedIn: boolean;
  hasFavoriteGenres: boolean;
}) {
  const [reviewTarget, setReviewTarget] = useState<BookWithStats | null>(
    null
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">추천</h1>
        <p className="mt-1 text-muted">
          다른 독자들이 많이 살펴본 감상평을 추천해드려요.
        </p>
      </div>

      {isLoggedIn ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">취향 맞춤 추천</h2>
          {hasFavoriteGenres ? (
            <BookGrid
              books={personalized}
              isLoggedIn={isLoggedIn}
              onReview={setReviewTarget}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
              책에 4점 이상의 감상을 남기면, 좋아하는 장르를 바탕으로 맞춤
              추천을 보여드려요.
            </p>
          )}
        </section>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
          로그인하면 내 취향에 맞는 책을 추천받을 수 있어요.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">많이 본 감상평</h2>
        <PopularReviewList reviews={popularReviews} />
      </section>

      {reviewTarget && (
        <ReviewModal
          book={reviewTarget}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}
