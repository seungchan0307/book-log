import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getGenreDistribution, getMonthlyReadingCounts } from "@/lib/data";
import GenreDistributionChart from "@/components/GenreDistributionChart";
import MonthlyReadingChart from "@/components/MonthlyReadingChart";

export default async function StatsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">통계</h1>
        <p className="text-muted">
          로그인하면 월별 독서량과 장르 분포를 확인할 수 있어요.
        </p>
        <Link
          href="/login"
          className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:opacity-90"
        >
          로그인
        </Link>
      </div>
    );
  }

  const monthlyCounts = await getMonthlyReadingCounts(user.id);
  const genreDistribution = await getGenreDistribution(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">통계</h1>
        <p className="mt-1 text-muted">
          지금까지 읽은 책을 숫자로 돌아봐요.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">월별 독서량</h2>
        {monthlyCounts.every((m) => m.count === 0) ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
            아직 다 읽은 책이 없어요.
          </p>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4">
            <MonthlyReadingChart data={monthlyCounts} />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">장르 분포</h2>
        {genreDistribution.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
            아직 남긴 감상이 없어요.
          </p>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4">
            <GenreDistributionChart distribution={genreDistribution} />
          </div>
        )}
      </section>
    </div>
  );
}
