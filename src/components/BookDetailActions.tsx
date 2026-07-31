"use client";

import { useState } from "react";
import Link from "next/link";
import ReviewModal from "@/components/ReviewModal";
import type { BookWithStats } from "@/lib/types";

export default function BookDetailActions({
  book,
  isLoggedIn,
  inLibrary,
}: {
  book: BookWithStats;
  isLoggedIn: boolean;
  inLibrary: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <span className="self-start rounded-md border border-border px-4 py-2 text-sm text-muted">
        로그인하면 감상을 남길 수 있어요
      </span>
    );
  }

  if (!inLibrary) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <span className="text-sm text-muted">
          감상을 남기려면 읽은 책을 서재에 추가해주세요.
        </span>
        <Link
          href="/library"
          className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          나의 서재로 가기
        </Link>
      </div>
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
