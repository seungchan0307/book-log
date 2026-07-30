import { getCurrentUser } from "@/lib/session";
import { searchBooksForExplore } from "@/lib/data";
import ExploreClient from "@/components/ExploreClient";

export default async function ExplorePage() {
  const user = await getCurrentUser();
  const books = await searchBooksForExplore(user?.id ?? null, "");

  return <ExploreClient books={books} />;
}
