"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { fetchTopRatedBooksByGenre } from "@/app/actions/books";
import BookCard from "@/components/BookCard";
import GenreSelect from "@/components/GenreSelect";
import LikeButton from "@/components/LikeButton";
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

// A horizontally-scrolling, cover-forward row — meant to read as "책갈피가
// 골라서 먼저 보여주는" curated picks, not a plain list.
function BookPosterRow({
  books,
  metric,
}: {
  books: BookWithStats[];
  metric: (book: BookWithStats) => React.ReactNode;
}) {
  if (books.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
        아직 보여줄 책이 없어요.
      </p>
    );
  }
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/books/${book.id}`}
          className="flex w-32 shrink-0 flex-col gap-1.5"
        >
          <div className="flex h-44 w-32 items-center justify-center overflow-hidden rounded-lg bg-card text-3xl text-muted shadow-sm">
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
          <p className="line-clamp-2 text-sm font-medium leading-snug">
            {book.title}
          </p>
          {metric(book)}
        </Link>
      ))}
    </div>
  );
}

function PopularReviewList({
  reviews,
  isLoggedIn,
}: {
  reviews: PopularReview[];
  isLoggedIn: boolean;
}) {
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
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">{r.reviewer_nickname}</span>
              <LikeButton
                reviewId={r.id}
                initialLiked={r.liked_by_me === 1}
                initialCount={r.like_count}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function RecommendClient({
  popularReviews,
  mostViewed,
  topRated,
  personalized,
  isLoggedIn,
  hasFavoriteGenres,
}: {
  popularReviews: PopularReview[];
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
            <StarDisplay
              rating={book.avg_rating}
              reviewCount={book.review_count}
              size="text-sm"
            />
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
              <StarDisplay
                rating={book.avg_rating}
                reviewCount={book.review_count}
                size="text-sm"
              />
            )}
          />
        )}
      </section>

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
        <PopularReviewList reviews={popularReviews} isLoggedIn={isLoggedIn} />
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
