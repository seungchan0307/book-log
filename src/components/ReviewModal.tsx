"use client";

import { useActionState, useEffect } from "react";
import { upsertReview, type ReviewFormState } from "@/app/actions/reviews";
import { StarPicker } from "@/components/StarRating";
import type { BookWithStats } from "@/lib/types";

const initialState: ReviewFormState = {};

export default function ReviewModal({
  book,
  onClose,
}: {
  book: BookWithStats;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(upsertReview, initialState);

  // Notifying the parent to close is a side effect on another component, so
  // it must run in an effect rather than during ReviewModal's own render.
  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{book.title}</h3>
            {book.author && (
              <p className="text-sm text-muted">{book.author}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="book_id" value={book.id} />
          <div>
            <span className="mb-1 block text-sm font-medium">평점</span>
            <StarPicker name="rating" defaultValue={book.my_rating ?? 0} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="content" className="text-sm font-medium">
              감상평 (선택)
            </label>
            <textarea
              id="content"
              name="content"
              rows={4}
              defaultValue={book.my_review_content ?? ""}
              placeholder="감상평 없이 평점만 남겨도 돼요"
              className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_public"
              defaultChecked={book.my_review_is_public !== 0}
              className="h-4 w-4 accent-accent"
            />
            다른 사람에게 감상평 공개하기
          </label>
          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "저장 중..." : "저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
