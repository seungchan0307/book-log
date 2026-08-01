import type { GenreDistributionRow } from "@/lib/types";

export default function GenreDistributionChart({
  distribution,
}: {
  distribution: GenreDistributionRow[];
}) {
  if (distribution.length === 0) return null;
  const max = Math.max(...distribution.map((r) => r.count));

  return (
    <div className="flex flex-col gap-1.5">
      {distribution.map((r) => {
        const pct = max > 0 ? (r.count / max) * 100 : 0;
        return (
          <div
            key={r.genre}
            className="flex items-center gap-2 text-xs text-muted"
            title={`${r.genre} ${r.count}권`}
          >
            <span className="w-20 shrink-0 truncate text-right">
              {r.genre}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 shrink-0 tabular-nums">{r.count}권</span>
          </div>
        );
      })}
    </div>
  );
}
