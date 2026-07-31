"use client";

import { useRef, useState } from "react";
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
  // useTransition's isPending doesn't reliably stay true for the duration of
  // an awaited async transition callback, so a fast second click could slip
  // through and fire an overlapping request. Guard with a plain ref instead.
  const isBusyRef = useRef(false);
  const [isBusy, setIsBusy] = useState(false);

  async function handleClick() {
    if (!isLoggedIn || isBusyRef.current) return;
    isBusyRef.current = true;
    setIsBusy(true);

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    try {
      const result = await toggleReviewLike(reviewId);
      if ("error" in result) {
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
        return;
      }
      setLiked(result.liked);
      setCount(result.likeCount);
    } finally {
      isBusyRef.current = false;
      setIsBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isLoggedIn || isBusy}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
      title={isLoggedIn ? undefined : "로그인하면 좋아요를 남길 수 있어요"}
      className={`flex h-10 min-w-10 flex-col items-center justify-center gap-0.5 rounded-md border text-xs transition-colors disabled:cursor-default ${
        liked
          ? "border-red-300 bg-red-50 text-red-500"
          : "border-border text-muted"
      } ${isLoggedIn ? "hover:border-red-300 hover:text-red-500" : ""}`}
    >
      <span className="text-base leading-none">{liked ? "♥" : "♡"}</span>
      <span className="text-[10px] leading-none">{count}</span>
    </button>
  );
}
