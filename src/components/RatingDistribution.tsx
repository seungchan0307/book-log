import type { RatingDistributionRow } from "@/lib/types";

export default function RatingDistribution({
  distribution,
}: {
  distribution: RatingDistributionRow[];
}) {
  const total = distribution.reduce((sum, r) => sum + r.count, 0);
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {distribution.map((r) => {
        const pct = total > 0 ? (r.count / total) * 100 : 0;
        return (
          <div
            key={r.star}
            className="flex items-center gap-2 text-xs text-muted"
            title={`${r.star}점 ${r.count}명 (${Math.round(pct)}%)`}
          >
            <span className="w-6 shrink-0 text-right">{r.star}점</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 tabular-nums">{r.count}명</span>
          </div>
        );
      })}
    </div>
  );
}
