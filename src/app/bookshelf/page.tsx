import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import {
  getBookshelfMeta,
  getUnusedGachaTicketCount,
  listMyBookshelfItems,
} from "@/lib/data";
import BookshelfClient from "@/components/BookshelfClient";

export default async function BookshelfPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">책장</h1>
        <p className="text-muted">
          로그인하면 책을 읽고 뽑기 아이템을 모을 수 있어요.
        </p>
        <Link
          href="/login"
          className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:opacity-90"
        >
          로그인
        </Link>
      </div>
    );
  }

  const [ticketCount, items, { bookmarkTokens, bookshelfRows }] =
    await Promise.all([
      getUnusedGachaTicketCount(user.id),
      listMyBookshelfItems(user.id),
      getBookshelfMeta(user.id),
    ]);

  return (
    <BookshelfClient
      ticketCount={ticketCount}
      items={items}
      bookmarkTokens={bookmarkTokens}
      bookshelfRows={bookshelfRows}
    />
  );
}
