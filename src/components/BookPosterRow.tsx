import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import BookPlaceholder from "@/components/BookPlaceholder";
import type { BookWithStats } from "@/lib/types";

// A horizontally-scrolling, cover-forward row — meant to read as a curated
// pick, not a plain list.
export default function BookPosterRow({
  books,
  metric,
  emptyMessage = "아직 보여줄 책이 없어요.",
  onBookClick,
}: {
  books: BookWithStats[];
  metric: (book: BookWithStats) => ReactNode;
  emptyMessage?: string;
  onBookClick?: (book: BookWithStats) => void;
}) {
  if (books.length === 0) {
    return <p className="empty">{emptyMessage}</p>;
  }
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/books/${book.id}`}
          onClick={() => onBookClick?.(book)}
          className="flex w-32 shrink-0 flex-col gap-1.5"
        >
          <div className="relative flex h-44 w-32 items-center justify-center overflow-hidden rounded-lg border border-border bg-card text-3xl text-muted">
            {book.cover_url ? (
              <Image
                src={book.cover_url}
                alt={book.title}
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <BookPlaceholder className="h-10 w-10" />
            )}
          </div>
          <p className="line-clamp-2 text-sm font-medium leading-snug">
            {book.title}
          </p>
          {metric(book)}
        </Link>
      ))}
    </div>
  );
}
