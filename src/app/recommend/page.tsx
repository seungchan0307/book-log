import { getCurrentUser } from "@/lib/session";
import {
  getPersonalizedRecommendations,
  getPopularReviews,
  hasFavoriteGenres,
} from "@/lib/data";
import RecommendClient from "@/components/RecommendClient";

export default async function RecommendPage() {
  const user = await getCurrentUser();
  const popularReviews = await getPopularReviews(20);
  const personalized = user
    ? await getPersonalizedRecommendations(user.id, 12)
    : [];
  const favoriteGenres = user ? await hasFavoriteGenres(user.id) : false;

  return (
    <RecommendClient
      popularReviews={popularReviews}
      personalized={personalized}
      isLoggedIn={Boolean(user)}
      hasFavoriteGenres={favoriteGenres}
    />
  );
}
