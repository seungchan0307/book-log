"use client";

import { useState } from "react";
import ReviewModal from "@/components/ReviewModal";
import type { BookWithStats } from "@/lib/types";

export default function BookDetailActions({
  book,
  isLoggedIn,
}: {
  book: BookWithStats;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <span className="self-start rounded-md border border-border px-4 py-2 text-sm text-muted">
        로그인하면 감상을 남길 수 있어요
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="self-start rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90"
      >
        {book.my_rating ? "내 감상 수정" : "감상 남기기"}
      </button>
      {open && <ReviewModal book={book} onClose={() => setOpen(false)} />}
    </>
  );
}
