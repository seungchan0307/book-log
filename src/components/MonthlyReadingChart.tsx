import type { MonthlyReadingCount } from "@/lib/types";

const CHART_H = 112; // px, matches the plot height below

// Round the top tick up to a step a reader can read at a glance (1, 2, 5, 10,
// 20, 50...), the way every other chart in the app scales its axis.
function niceMax(dataMax: number): number {
  if (dataMax <= 1) return 1;
  const steps = [1, 2, 3, 5, 10, 15, 20, 30, 50, 100];
  return steps.find((s) => s >= dataMax) ?? Math.ceil(dataMax / 50) * 50;
}

export default function MonthlyReadingChart({
  data,
}: {
  data: MonthlyReadingCount[];
}) {
  const dataMax = Math.max(0, ...data.map((d) => d.count));
  const max = niceMax(dataMax);
  // Small integer ranges read best as every step; larger ones as even
  // fractions of the top tick (0/5/10, 0/10/20...), never an odd midpoint.
  const ticks =
    max <= 6
      ? Array.from({ length: max + 1 }, (_, i) => i)
      : [0, max / 2, max];

  return (
    <div className="flex gap-2">
      <div
        className="flex flex-col-reverse justify-between text-[11px] text-muted"
        style={{ height: CHART_H }}
      >
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="flex-1">
        <div
          className="relative flex items-end gap-1.5 border-l border-rule"
          style={{ height: CHART_H }}
        >
          {ticks.map((t) => (
            <div
              key={t}
              className="pointer-events-none absolute left-0 right-0 border-t border-rule"
              style={{ bottom: `${(t / max) * 100}%` }}
            />
          ))}
          {data.map((d) => {
            const [year, month] = d.month.split("-");
            const label = `${year.slice(2)}.${month}`;
            const pct = (d.count / max) * 100;
            return (
              <div
                key={d.month}
                className="relative flex h-full flex-1 items-end justify-center"
                title={`${label} · ${d.count}권`}
              >
                <div
                  className="w-full rounded-t bg-accent"
                  style={{ height: `${pct}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex gap-1.5">
          {data.map((d) => {
            const [year, month] = d.month.split("-");
            return (
              <span key={d.month} className="flex-1 text-center text-[10px] text-muted">
                {year.slice(2)}.{month}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
