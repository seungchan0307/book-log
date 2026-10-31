import { getCurrentUser } from "@/lib/session";
import {
  getBookshelfMeta,
  getCurrentMonthReadCount,
  getMonthlyGoal,
  getUnusedGachaTicketCount,
  listMyBooksWithStats,
  listMyReviews,
} from "@/lib/data";
import AuthGate from "@/components/AuthGate";
import LibraryClient from "@/components/LibraryClient";

export default async function LibraryPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AuthGate
        title="나의 서재"
        description="로그인하면 책을 등록하고 감상을 남길 수 있어요."
      />
    );
  }

  const books = await listMyBooksWithStats(user.id);
  const myReviews = await listMyReviews(user.id);
  const currentMonthCount = await getCurrentMonthReadCount(user.id);
  const monthlyGoal = await getMonthlyGoal(user.id);
  const gachaTicketCount = await getUnusedGachaTicketCount(user.id);
  const { bookmarkTokens } = await getBookshelfMeta(user.id);

  return (
    <LibraryClient
      books={books}
      myReviews={myReviews}
      currentMonthCount={currentMonthCount}
      monthlyGoal={monthlyGoal}
      gachaTicketCount={gachaTicketCount}
      bookmarkTokens={bookmarkTokens}
    />
  );
}
