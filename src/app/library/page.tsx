import { getCurrentUser } from "@/lib/session";
import { listMyBooksWithStats, listMyReviews } from "@/lib/data";
import LibraryClient from "@/components/LibraryClient";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  const books = user ? await listMyBooksWithStats(user.id) : [];
  const myReviews = user ? await listMyReviews(user.id) : [];

  return (
    <LibraryClient
      books={books}
      myReviews={myReviews}
      isLoggedIn={Boolean(user)}
      currentUserId={user?.id ?? null}
    />
  );
}
