"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import { StarDisplay } from "@/components/StarRating";
import type { PopularReview } from "@/lib/types";

type SortMode = "latest" | "popular";

export default function PopularReviewList({
  reviews,
  isLoggedIn,
  sortable = false,
}: {
  reviews: PopularReview[];
  isLoggedIn: boolean;
  sortable?: boolean;
}) {
  const [sort, setSort] = useState<SortMode>("latest");

  const sorted = useMemo(() => {
    if (!sortable) return reviews;
    const copy = [...reviews];
    if (sort === "popular") {
      copy.sort(
        (a, b) =>
          b.like_count - a.like_count ||
          b.updated_at.localeCompare(a.updated_at)
      );
    } else {
      copy.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    }
    return copy;
  }, [reviews, sort, sortable]);

  if (reviews.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
        아직 보여줄 감상평이 없어요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sortable && (
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setSort("latest")}
            className={`rounded-md border px-3 py-1 ${
              sort === "latest"
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border hover:bg-card"
            }`}
          >
            최신순
          </button>
          <button
            type="button"
            onClick={() => setSort("popular")}
            className={`rounded-md border px-3 py-1 ${
              sort === "popular"
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border hover:bg-card"
            }`}
          >
            인기순
          </button>
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {sorted.map((r) => (
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
                <span className="text-xs text-muted">
                  {r.reviewer_nickname}
                  {sortable && ` · ${r.updated_at.slice(0, 10)}`}
                </span>
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
    </div>
  );
}
