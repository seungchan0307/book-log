import { getCurrentUser } from "@/lib/session";
import {
  getMostViewedBooks,
  getPersonalizedRecommendations,
  getTopRatedBooks,
  hasFavoriteGenres,
} from "@/lib/data";
import RecommendClient from "@/components/RecommendClient";

const MIN_REVIEWS_FOR_TOP_RATED = 10;
const MOST_VIEWED_LIMIT = 6;

export default async function RecommendPage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const mostViewed = await getMostViewedBooks(userId, MOST_VIEWED_LIMIT);
  const topRated = await getTopRatedBooks(
    userId,
    MIN_REVIEWS_FOR_TOP_RATED,
    12
  );
  const personalized = user
    ? await getPersonalizedRecommendations(user.id, 12)
    : [];
  const favoriteGenres = user ? await hasFavoriteGenres(user.id) : false;

  return (
    <RecommendClient
      mostViewed={mostViewed}
      topRated={topRated}
      personalized={personalized}
      isLoggedIn={Boolean(user)}
      hasFavoriteGenres={favoriteGenres}
    />
  );
}
