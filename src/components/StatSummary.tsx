import type { ReadingStatsSummary } from "@/lib/types";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1 px-4 py-3 first:pl-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="num truncate text-2xl font-semibold">{value}</span>
    </div>
  );
}

export default function StatSummary({
  summary,
}: {
  summary: ReadingStatsSummary;
}) {
  return (
    <div className="flex divide-x divide-border rounded-lg border border-border bg-card px-4">
      <Tile label="누적 읽은 책" value={`${summary.totalFinished}권`} />
      <Tile
        label="평균 별점"
        value={summary.avgRating !== null ? summary.avgRating.toFixed(1) : "-"}
      />
      <Tile
        label="가장 좋아하는 장르"
        value={summary.favoriteGenre?.genre ?? "-"}
      />
    </div>
  );
}
