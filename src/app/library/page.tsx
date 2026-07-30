import { getCurrentUser } from "@/lib/session";
import { listBooksWithStats, listMyReviews } from "@/lib/data";
import LibraryClient from "@/components/LibraryClient";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  const books = await listBooksWithStats(user?.id ?? null);
  const myReviews = user ? await listMyReviews(user.id) : [];

  return (
    <LibraryClient
      books={books}
      myReviews={myReviews}
      isLoggedIn={Boolean(user)}
    />
  );
}
