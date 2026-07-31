import { getCurrentUser } from "@/lib/session";
import {
  getMostViewedBooks,
  getPersonalizedRecommendations,
  getPopularReviews,
  getTopRatedBooks,
  hasFavoriteGenres,
} from "@/lib/data";
import RecommendClient from "@/components/RecommendClient";

const MIN_REVIEWS_FOR_TOP_RATED = 10;

export default async function RecommendPage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const popularReviews = await getPopularReviews(20);
  const mostViewed = await getMostViewedBooks(userId, 12);
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
      popularReviews={popularReviews}
      mostViewed={mostViewed}
      topRated={topRated}
      personalized={personalized}
      isLoggedIn={Boolean(user)}
      hasFavoriteGenres={favoriteGenres}
    />
  );
}
