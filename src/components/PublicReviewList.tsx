"use client";

import { useMemo, useState } from "react";
import LikeButton from "@/components/LikeButton";
import { StarDisplay } from "@/components/StarRating";
import type { PublicReview } from "@/lib/types";

type SortMode = "latest" | "popular";

export default function PublicReviewList({
  reviews,
  isLoggedIn,
}: {
  reviews: PublicReview[];
  isLoggedIn: boolean;
}) {
  const [sort, setSort] = useState<SortMode>("latest");

  const sorted = useMemo(() => {
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
  }, [reviews, sort]);

  if (reviews.length === 0) {
    return (
      <p className="empty">
        아직 공개된 감상평이 없어요. 이 책을 읽었다면 감상을 가장 먼저
        남겨보세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setSort("latest")}
          className={`segmented-btn ${sort === "latest" ? "segmented-btn-on" : "segmented-btn-off"}`}
        >
          최신순
        </button>
        <button
          type="button"
          onClick={() => setSort("popular")}
          className={`segmented-btn ${sort === "popular" ? "segmented-btn-on" : "segmented-btn-off"}`}
        >
          인기순
        </button>
      </div>
      <ul className="panel flex flex-col">
        {sorted.map((r) => (
          <li key={r.id} className="feed-row flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.reviewer_nickname}</span>
              <StarDisplay rating={r.rating} />
            </div>
            {r.content && (
              <p className="whitespace-pre-wrap text-sm">{r.content}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">
                {r.updated_at.slice(0, 10)}
              </span>
              <LikeButton
                reviewId={r.id}
                initialLiked={r.liked_by_me === 1}
                initialCount={r.like_count}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
