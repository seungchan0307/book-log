import type { DayStatus } from "@/lib/types";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function MonthCalendar({
  days,
  today,
}: {
  days: DayStatus[];
  today: string;
}) {
  if (days.length === 0) return null;

  const [year, month, todayDate] = today.split("-").map(Number);
  const firstDow = new Date(`${days[0].date}T00:00:00`).getDay();
  const cells: (DayStatus | null)[] = [...Array(firstDow).fill(null), ...days];

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-4xl font-bold">
          {month}월 <span className="text-accent">{todayDate}</span>일
        </p>
        <p className="text-base text-muted">{year}년</p>
      </div>
      <div className="grid w-full grid-cols-7 gap-y-2 text-center">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-sm text-muted">
            {w}
          </div>
        ))}
        {cells.map((day, i) =>
          day ? (
            <div key={day.date} className="flex justify-center py-1">
              <span
                className={
                  "flex h-12 w-12 items-center justify-center rounded-full text-lg " +
                  (day.status === "read"
                    ? "bg-accent text-accent-foreground"
                    : day.status === "skipped"
                      ? "border border-border text-muted"
                      : "text-muted") +
                  (day.date === today ? " ring-2 ring-accent ring-offset-2 ring-offset-card" : "")
                }
                title={
                  day.status === "read"
                    ? "읽음"
                    : day.status === "skipped"
                      ? "읽지 않음"
                      : "기록 없음"
                }
              >
                {Number(day.date.split("-")[2])}
              </span>
            </div>
          ) : (
            <div key={`empty-${i}`} />
          )
        )}
      </div>
    </div>
  );
}
