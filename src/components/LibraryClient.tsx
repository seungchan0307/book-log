"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AddBookForm from "@/components/AddBookForm";
import BookCard from "@/components/BookCard";
import GenreSelect from "@/components/GenreSelect";
import MonthlyGoalCard from "@/components/MonthlyGoalCard";
import ReviewModal from "@/components/ReviewModal";
import { StarDisplay } from "@/components/StarRating";
import { deleteReview } from "@/app/actions/reviews";
import type {
  BookReadingStatus,
  BookWithStats,
  ReviewWithBook,
} from "@/lib/types";

const READING_STATUS_LABELS: Record<BookReadingStatus, string> = {
  finished: "읽은 책",
  reading: "읽는 중",
  want_to_read: "읽을 예정",
};
const READING_STATUS_ORDER: BookReadingStatus[] = [
  "finished",
  "reading",
  "want_to_read",
];

export default function LibraryClient({
  books,
  myReviews,
  currentMonthCount,
  monthlyGoal,
  gachaTicketCount,
  bookmarkTokens,
}: {
  books: BookWithStats[];
  myReviews: ReviewWithBook[];
  currentMonthCount: number;
  monthlyGoal: number | null;
  gachaTicketCount: number;
  bookmarkTokens: number;
}) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [reviewTarget, setReviewTarget] = useState<BookWithStats | null>(
    null
  );
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      if (genre && b.genre !== genre) return false;
      if (search) {
        const q = search.toLowerCase();
        const inTitle = b.title.toLowerCase().includes(q);
        const inAuthor = (b.author ?? "").toLowerCase().includes(q);
        if (!inTitle && !inAuthor) return false;
      }
      return true;
    });
  }, [books, search, genre]);

  // Books registered before the reading-status feature existed have no
  // my_reading_status — they all carry a review, so treat that gap as 읽은 책.
  const grouped = useMemo(() => {
    const groups: Record<BookReadingStatus, BookWithStats[]> = {
      finished: [],
      reading: [],
      want_to_read: [],
    };
    for (const book of filtered) {
      groups[book.my_reading_status ?? "finished"].push(book);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-3">
        {addOpen ? (
          <nav className="text-sm text-muted">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="hover:text-accent hover:underline"
            >
              나의 서재
            </button>
            {" / "}
            <span className="text-foreground">책 등록하기</span>
          </nav>
        ) : (
          <h1 className="text-2xl font-bold">나의 서재</h1>
        )}
        {addOpen ? (
          <AddBookForm onOpenChange={setAddOpen} />
        ) : (
          <button
            onClick={() => setAddOpen(true)}
            className="self-start rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90"
          >
            + 책 등록하기
          </button>
        )}
      </div>

      {!addOpen && (
        <>
          <MonthlyGoalCard currentCount={currentMonthCount} goal={monthlyGoal} />

          <Link
            href="/bookshelf"
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-accent"
          >
            <span className="flex items-center gap-2 font-medium">
              🎁 책장 구경하기
            </span>
            <span className="text-sm text-muted">
              뽑기권 {gachaTicketCount}장 · 책갈피 토큰 {bookmarkTokens}개
            </span>
          </Link>

          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목 또는 저자로 검색"
              className="flex-1 min-w-[200px] rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-accent"
            />
            <div className="w-48">
              <GenreSelect
                value={genre}
                onChange={setGenre}
                placeholder="장르로 검색"
                clearLabel="전체 장르"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
              {books.length === 0
                ? "아직 등록된 책이 없어요. 첫 책을 등록해보세요!"
                : "조건에 맞는 책이 없어요."}
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {READING_STATUS_ORDER.map((status) => {
                const statusBooks = grouped[status];
                if (statusBooks.length === 0) return null;
                return (
                  <div key={status} className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-muted">
                      {READING_STATUS_LABELS[status]} ({statusBooks.length})
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {statusBooks.map((book) => (
                        <BookCard
                          key={book.id}
                          book={book}
                          isLoggedIn
                          onReview={setReviewTarget}
                          canRemove
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!addOpen && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">내가 남긴 감상</h2>
          {myReviews.length === 0 ? (
            <p className="text-muted">아직 남긴 감상이 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {myReviews.map((r) => (
                <li
                  key={r.id}
                  className="flex gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <Link
                    href={`/books/${r.book_id}`}
                    className="relative flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-background text-xl text-muted"
                  >
                    {r.book_cover_url ? (
                      <Image
                        src={r.book_cover_url}
                        alt={r.book_title}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      "📖"
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-medium">{r.book_title}</span>
                        {r.book_author && (
                          <span className="ml-2 text-sm text-muted">
                            {r.book_author}
                          </span>
                        )}
                      </div>
                      <StarDisplay rating={r.rating} />
                    </div>
                    {r.content && (
                      <p className="whitespace-pre-wrap text-sm">
                        {r.content}
                      </p>
                    )}
                    <form
                      action={deleteReview}
                      className="self-start"
                      onSubmit={(e) => {
                        if (!window.confirm("감상을 지우시겠습니까?")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="review_id" value={r.id} />
                      <button
                        type="submit"
                        className="text-xs text-muted hover:text-red-600"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          book={reviewTarget}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}
