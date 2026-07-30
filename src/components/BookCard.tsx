"use client";

import Link from "next/link";
import { StarDisplay } from "@/components/StarRating";
import type { BookWithStats } from "@/lib/types";

export default function BookCard({
  book,
  isLoggedIn,
  onReview,
}: {
  book: BookWithStats;
  isLoggedIn: boolean;
  onReview: (book: BookWithStats) => void;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
      <Link
        href={`/books/${book.id}`}
        className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-background text-2xl text-muted"
      >
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
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/books/${book.id}`} className="hover:underline">
              <h3 className="truncate font-semibold">{book.title}</h3>
            </Link>
            {book.author && (
              <p className="truncate text-sm text-muted">{book.author}</p>
            )}
          </div>
          {book.genre && (
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {book.genre}
            </span>
          )}
        </div>
        <StarDisplay rating={book.avg_rating} reviewCount={book.review_count} />
        {isLoggedIn ? (
          <button
            onClick={() => onReview(book)}
            className="mt-1 self-start rounded-md border border-border px-3 py-1 text-sm hover:bg-background"
          >
            {book.my_rating ? "내 감상 수정" : "감상 남기기"}
          </button>
        ) : (
          <span className="mt-1 self-start rounded-md border border-border px-3 py-1 text-sm text-muted">
            로그인하면 감상을 남길 수 있어요
          </span>
        )}
      </div>
    </div>
  );
}
