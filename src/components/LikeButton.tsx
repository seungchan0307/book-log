"use client";

import { useState, useTransition } from "react";
import { toggleReviewLike } from "@/app/actions/reviews";

export default function LikeButton({
  reviewId,
  initialLiked,
  initialCount,
  isLoggedIn,
}: {
  reviewId: number;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isLoggedIn || isPending) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    startTransition(async () => {
      const result = await toggleReviewLike(reviewId);
      if ("error" in result) {
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
        return;
      }
      setLiked(result.liked);
      setCount(result.likeCount);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isLoggedIn || isPending}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
      title={isLoggedIn ? undefined : "로그인하면 좋아요를 남길 수 있어요"}
      className={`flex items-center gap-1 text-xs transition-colors disabled:cursor-default ${
        liked ? "text-red-500" : "text-muted"
      } ${isLoggedIn ? "hover:text-red-500" : ""}`}
    >
      <span>{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}
