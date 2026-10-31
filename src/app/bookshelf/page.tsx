import { getCurrentUser } from "@/lib/session";
import {
  getBookshelfMeta,
  getUnusedGachaTicketCount,
  listMyBookshelfItems,
} from "@/lib/data";
import AuthGate from "@/components/AuthGate";
import BookshelfClient from "@/components/BookshelfClient";

export default async function BookshelfPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AuthGate
        title="책장"
        description="로그인하면 책을 읽고 뽑기 아이템을 모을 수 있어요."
      />
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
