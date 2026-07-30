import MonthCalendar from "@/components/MonthCalendar";
import type { DayStatus, ReadingLogStatus } from "@/lib/types";

export default function ReadingStatusCard({
  status,
  streak,
  totalDaysRead,
  monthDays,
  today,
}: {
  status: ReadingLogStatus;
  streak: number;
  totalDaysRead: number;
  monthDays: DayStatus[];
  today: string;
}) {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-5 rounded-lg border border-border bg-card p-6">
      {status === "read" ? (
        <div className="flex flex-col items-center gap-1">
          {streak >= 2 && (
            <p className="text-2xl font-bold">
              <span className="text-accent">{streak}일</span> 연속 읽는
              중이에요
            </p>
          )}
          <p
            className={
              streak >= 2
                ? "text-sm text-muted"
                : "text-2xl font-bold"
            }
          >
            <span className="text-accent">{totalDaysRead}일째</span> 읽는
            중이에요
          </p>
        </div>
      ) : (
        <p className="text-xl font-semibold text-muted">
          오늘은 쉬어가는 날이에요. 내일 다시 도전해봐요!
        </p>
      )}
      <MonthCalendar days={monthDays} today={today} />
    </div>
  );
}
