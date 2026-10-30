import { getCurrentUser } from "@/lib/session";
import {
  getGenreDistribution,
  getMonthlyReadingCounts,
  getReadingStatsSummary,
} from "@/lib/data";
import AuthGate from "@/components/AuthGate";
import GenreDistributionChart from "@/components/GenreDistributionChart";
import MonthlyReadingChart from "@/components/MonthlyReadingChart";
import StatSummary from "@/components/StatSummary";

export default async function StatsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AuthGate
        title="통계"
        description="로그인하면 월별 독서량과 장르 분포를 확인할 수 있어요."
      />
    );
  }

  const monthlyCounts = await getMonthlyReadingCounts(user.id);
  const genreDistribution = await getGenreDistribution(user.id);
  const summary = await getReadingStatsSummary(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">통계</h1>
        <p className="mt-1 text-muted">
          지금까지 읽은 책을 숫자로 돌아봐요.
        </p>
      </div>

      <StatSummary summary={summary} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">월별 독서량</h2>
        {monthlyCounts.every((m) => m.count === 0) ? (
          <p className="empty">아직 다 읽은 책이 없어요.</p>
        ) : (
          <div className="panel">
            <MonthlyReadingChart data={monthlyCounts} />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">장르 분포</h2>
        {genreDistribution.length === 0 ? (
          <p className="empty">아직 남긴 감상이 없어요.</p>
        ) : (
          <div className="panel">
            <GenreDistributionChart distribution={genreDistribution} />
          </div>
        )}
      </section>
    </div>
  );
}
