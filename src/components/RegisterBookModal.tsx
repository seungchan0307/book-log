"use client";

import { useActionState, useEffect, useState } from "react";
import {
  addExistingBookToLibrary,
  type BookFormState,
} from "@/app/actions/books";
import { StarPicker } from "@/components/StarRating";

const initialState: BookFormState = {};

type ReadingStatus = "finished" | "reading" | "want_to_read";

const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  finished: "다 읽음",
  reading: "읽는 중",
  want_to_read: "읽을 예정",
};

export default function RegisterBookModal({
  bookId,
  title,
  author,
  onClose,
}: {
  bookId: number;
  title: string;
  author: string | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    addExistingBookToLibrary,
    initialState
  );
  const [readingStatus, setReadingStatusState] =
    useState<ReadingStatus>("finished");
  const [wantsReviewWhileReading, setWantsReviewWhileReading] =
    useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  function setReadingStatus(status: ReadingStatus) {
    setReadingStatusState(status);
    setWantsReviewWhileReading(false);
  }

  const showReviewSection =
    readingStatus === "finished" ||
    (readingStatus === "reading" && wantsReviewWhileReading);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{title}</h3>
            {author && <p className="text-sm text-muted">{author}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <form
          action={action}
          onSubmit={(e) => {
            if (showReviewSection) {
              const rating = Number(
                new FormData(e.currentTarget).get("rating")
              );
              if (!rating || rating <= 0) {
                e.preventDefault();
                setClientError("평점을 선택해주세요.");
                return;
              }
            }
            setClientError(null);
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="book_id" value={bookId} />

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">읽기 상태 *</span>
            <input type="hidden" name="reading_status" value={readingStatus} />
            <div className="flex gap-2">
              {(Object.keys(READING_STATUS_LABELS) as ReadingStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setReadingStatus(status)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      readingStatus === status
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border hover:bg-background"
                    }`}
                  >
                    {READING_STATUS_LABELS[status]}
                  </button>
                )
              )}
            </div>
          </div>

          {readingStatus === "reading" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={wantsReviewWhileReading}
                onChange={(e) => setWantsReviewWhileReading(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              아직 읽는 중이신데, 그래도 감상평을 남기시겠어요?
            </label>
          )}

          {showReviewSection && (
            <div className="flex flex-col gap-3 border-t border-border pt-3">
              <div>
                <span className="mb-1 block text-sm font-medium">평점 *</span>
                <StarPicker name="rating" />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="content" className="text-sm font-medium">
                  감상평 (선택)
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={10}
                  placeholder="감상평 없이 평점만 남겨도 돼요"
                  className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_public"
                  defaultChecked
                  className="h-4 w-4 accent-accent"
                />
                다른 사람에게 감상평 공개하기
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_anonymous"
                  className="h-4 w-4 accent-accent"
                />
                익명으로 작성하기 (닉네임 대신 &quot;익명&quot;으로 표시돼요)
              </label>
            </div>
          )}

          {(clientError || state.error) && (
            <p className="text-sm text-red-600">{clientError || state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "등록 중..." : "등록"}
          </button>
        </form>
      </div>
    </div>
  );
}
