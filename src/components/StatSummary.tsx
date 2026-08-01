import type { ReadingStatsSummary } from "@/lib/types";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
      <span className="text-xs text-muted">{label}</span>
      <span className="truncate text-2xl font-bold">{value}</span>
    </div>
  );
}

export default function StatSummary({
  summary,
}: {
  summary: ReadingStatsSummary;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
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
