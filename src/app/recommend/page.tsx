import { getCurrentUser } from "@/lib/session";
import {
  getTopRatedBooks,
  getPersonalizedRecommendations,
  hasFavoriteGenres,
} from "@/lib/data";
import RecommendClient from "@/components/RecommendClient";

export default async function RecommendPage() {
  const user = await getCurrentUser();
  const topRated = await getTopRatedBooks(user?.id ?? null, 12);
  const personalized = user
    ? await getPersonalizedRecommendations(user.id, 12)
    : [];
  const favoriteGenres = user ? await hasFavoriteGenres(user.id) : false;

  return (
    <RecommendClient
      topRated={topRated}
      personalized={personalized}
      isLoggedIn={Boolean(user)}
      hasFavoriteGenres={favoriteGenres}
    />
  );
}
