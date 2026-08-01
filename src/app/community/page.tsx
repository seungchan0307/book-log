import { getCurrentUser } from "@/lib/session";
import { getPopularReviews } from "@/lib/data";
import PopularReviewList from "@/components/PopularReviewList";

const REVIEW_LIMIT = 100;

export default async function CommunityPage() {
  const user = await getCurrentUser();
  const reviews = await getPopularReviews(user?.id ?? null, REVIEW_LIMIT);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">이야기</h1>
        <p className="mt-1 text-muted">
          다른 독자들의 감상평을 구경해보세요.
        </p>
      </div>
      <PopularReviewList reviews={reviews} isLoggedIn={Boolean(user)} />
    </div>
  );
}
