"use client";

import { useState } from "react";
import ReviewModal from "@/components/ReviewModal";
import RegisterBookModal from "@/components/RegisterBookModal";
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
      <>
        <button
          onClick={() => setOpen(true)}
          className="self-start rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90"
        >
          책 등록하기
        </button>
        {open && (
          <RegisterBookModal
            bookId={book.id}
            title={book.title}
            author={book.author}
            onClose={() => setOpen(false)}
          />
        )}
      </>
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
