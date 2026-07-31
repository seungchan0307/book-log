"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteReviewForBook,
  upsertReview,
  type ReviewFormState,
} from "@/app/actions/reviews";
import { StarPicker } from "@/components/StarRating";
import type { BookWithStats } from "@/lib/types";

const initialState: ReviewFormState = {};

function draftKey(bookId: number) {
  return `book-log:review-draft:${bookId}`;
}

export default function ReviewModal({
  book,
  onClose,
}: {
  book: BookWithStats;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(upsertReview, initialState);
  const [isDeleting, startDelete] = useTransition();
  // Falls back to a locally-saved draft so an accidental close (or
  // navigating away) doesn't lose what was typed — only cleared once the
  // review actually saves.
  const [content, setContent] = useState(
    () =>
      window.localStorage.getItem(draftKey(book.id)) ??
      book.my_review_content ??
      ""
  );

  // Notifying the parent to close is a side effect on another component, so
  // it must run in an effect rather than during ReviewModal's own render.
  useEffect(() => {
    if (state.success) {
      window.localStorage.removeItem(draftKey(book.id));
      onClose();
    }
  }, [state, onClose, book.id]);

  function handleDelete() {
    if (!window.confirm("감상을 지우시겠습니까?")) return;
    startDelete(async () => {
      await deleteReviewForBook(book.id);
      window.localStorage.removeItem(draftKey(book.id));
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-5"
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
              rows={12}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                window.localStorage.setItem(draftKey(book.id), e.target.value);
              }}
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_anonymous"
              defaultChecked={book.my_review_is_anonymous === 1}
              className="h-4 w-4 accent-accent"
            />
            익명으로 작성하기 (닉네임 대신 &quot;익명&quot;으로 표시돼요)
          </label>
          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <div className="flex gap-2">
            {book.my_rating != null && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || pending}
                className="rounded-md border border-border px-4 py-2 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            )}
            <button
              type="submit"
              disabled={pending || isDeleting}
              className="rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
