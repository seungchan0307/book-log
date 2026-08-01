"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeFromMyLibrary } from "@/app/actions/books";
import { StarDisplay } from "@/components/StarRating";
import type { BookWithStats } from "@/lib/types";

export default function BookCard({
  book,
  isLoggedIn,
  onReview,
  canRemove = false,
}: {
  book: BookWithStats;
  isLoggedIn: boolean;
  onReview: (book: BookWithStats) => void;
  canRemove?: boolean;
}) {
  const router = useRouter();
  const [isRemoving, startRemove] = useTransition();

  function handleRemove() {
    if (!window.confirm("나의 서재에서 삭제하시겠습니까?")) return;
    const deleteReviewToo = window.confirm(
      "남긴 감상도 함께 삭제할까요? (취소하면 감상은 그대로 남아요)"
    );
    startRemove(async () => {
      await removeFromMyLibrary(book.id, deleteReviewToo);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
      <Link
        href={`/books/${book.id}`}
        className="relative flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-background text-2xl text-muted"
      >
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          "📖"
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/books/${book.id}`} className="hover:underline">
              <h3 className="truncate font-semibold">{book.title}</h3>
            </Link>
            {book.author && (
              <p className="truncate text-sm text-muted">{book.author}</p>
            )}
          </div>
          {book.genre && (
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {book.genre}
            </span>
          )}
        </div>
        <StarDisplay rating={book.avg_rating} />
        {isLoggedIn ? (
          <div className="mt-1 flex flex-wrap gap-2">
            <button
              onClick={() => onReview(book)}
              className="self-start rounded-md border border-border px-3 py-1 text-sm hover:bg-background"
            >
              {book.my_rating ? "내 감상 수정" : "감상 남기기"}
            </button>
            {canRemove && (
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="self-start rounded-md border border-border px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {isRemoving ? "삭제 중..." : "서재에서 삭제"}
              </button>
            )}
          </div>
        ) : (
          <span className="mt-1 self-start rounded-md border border-border px-3 py-1 text-sm text-muted">
            로그인하면 감상을 남길 수 있어요
          </span>
        )}
      </div>
    </div>
  );
}
