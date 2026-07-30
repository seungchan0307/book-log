"use client";

import { useState } from "react";
import BookCard from "@/components/BookCard";
import ReviewModal from "@/components/ReviewModal";
import type { BookWithStats } from "@/lib/types";

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

export default function RecommendClient({
  topRated,
  personalized,
  isLoggedIn,
  hasFavoriteGenres,
}: {
  topRated: BookWithStats[];
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
          다른 독자들의 평점을 바탕으로 책을 추천해드려요.
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
        <h2 className="text-xl font-bold">평점 높은 책</h2>
        <BookGrid
          books={topRated}
          isLoggedIn={isLoggedIn}
          onReview={setReviewTarget}
        />
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
