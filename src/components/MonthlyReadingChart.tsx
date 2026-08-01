import type { MonthlyReadingCount } from "@/lib/types";

export default function MonthlyReadingChart({
  data,
}: {
  data: MonthlyReadingCount[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex items-end gap-1.5">
      {data.map((d) => {
        const [year, month] = d.month.split("-");
        const label = `${year.slice(2)}.${month}`;
        const pct = (d.count / max) * 100;
        return (
          <div
            key={d.month}
            className="flex flex-1 flex-col items-center gap-1"
            title={`${label} · ${d.count}권`}
          >
            <div className="flex h-24 w-full items-end justify-center">
              <div
                className="w-full rounded-t bg-accent"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
