import { getCurrentUser } from "@/lib/session";
import {
  getTopRatedBooks,
  getPersonalizedRecommendations,
  hasFavoriteGenres,
} from "@/lib/data";
import RecommendClient from "@/components/RecommendClient";

export default async function RecommendPage() {
  const user = await getCurrentUser();
  const topRated = getTopRatedBooks(user?.id ?? null, 12);
  const personalized = user
    ? getPersonalizedRecommendations(user.id, 12)
    : [];

  return (
    <RecommendClient
      topRated={topRated}
      personalized={personalized}
      isLoggedIn={Boolean(user)}
      hasFavoriteGenres={user ? hasFavoriteGenres(user.id) : false}
    />
  );
}
