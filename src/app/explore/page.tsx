import { getCurrentUser } from "@/lib/session";
import {
  getRecentlyAddedBooks,
  getRecentSearchHistory,
  searchBooksForExplore,
} from "@/lib/data";
import ExploreClient from "@/components/ExploreClient";

const RECENT_LIMIT = 10;

export default async function ExplorePage() {
  const user = await getCurrentUser();
  const books = await searchBooksForExplore(user?.id ?? null, "");
  const recentlyAdded = await getRecentlyAddedBooks(
    user?.id ?? null,
    RECENT_LIMIT
  );
  const recentSearches = user
    ? await getRecentSearchHistory(user.id, RECENT_LIMIT)
    : [];

  return (
    <ExploreClient
      books={books}
      recentlyAdded={recentlyAdded}
      recentSearches={recentSearches}
      isLoggedIn={Boolean(user)}
    />
  );
}
