"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { fetchTopRatedBooksByGenre } from "@/app/actions/books";
import BookCard from "@/components/BookCard";
import BookPosterRow from "@/components/BookPosterRow";
import GenreSelect from "@/components/GenreSelect";
import ReviewModal from "@/components/ReviewModal";
import { StarDisplay } from "@/components/StarRating";
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
  mostViewed,
  topRated,
  personalized,
  isLoggedIn,
  hasFavoriteGenres,
}: {
  mostViewed: BookWithStats[];
  topRated: BookWithStats[];
  personalized: BookWithStats[];
  isLoggedIn: boolean;
  hasFavoriteGenres: boolean;
}) {
  const [reviewTarget, setReviewTarget] = useState<BookWithStats | null>(
    null
  );

  const [genre, setGenre] = useState("");
  const [genreBooks, setGenreBooks] = useState<BookWithStats[]>([]);
  const [isLoadingGenre, startGenreLoad] = useTransition();

  useEffect(() => {
    startGenreLoad(async () => {
      if (!genre) {
        setGenreBooks([]);
        return;
      }
      const books = await fetchTopRatedBooksByGenre(genre);
      setGenreBooks(books);
    });
  }, [genre]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">추천</h1>
        <p className="mt-1 text-muted">
          책갈피가 먼저 골라봤어요.
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">지금 많이 찾는 책</h2>
          <Link
            href="/explore"
            className="text-sm text-muted hover:text-accent"
          >
            더보기 &gt;
          </Link>
        </div>
        <BookPosterRow
          books={mostViewed}
          metric={(book) => (
            <span className="text-xs text-muted">
              탐색 {book.view_count}회
            </span>
          )}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">평점 높은 책</h2>
        <BookPosterRow
          books={topRated}
          metric={(book) => (
            <StarDisplay rating={book.avg_rating} size="text-sm" />
          )}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">장르별 인기</h2>
        <GenreSelect
          value={genre}
          onChange={setGenre}
          placeholder="장르를 선택해보세요"
          clearLabel="선택 안 함"
        />
        {!genre ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
            장르를 선택하면 그 장르에서 평점 높은 책을 보여드려요.
          </p>
        ) : isLoadingGenre ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
            불러오는 중...
          </p>
        ) : (
          <BookPosterRow
            books={genreBooks}
            metric={(book) => (
              <StarDisplay rating={book.avg_rating} size="text-sm" />
            )}
          />
        )}
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
