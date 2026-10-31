import { getCurrentUser } from "@/lib/session";
import {
  getCurrentStreak,
  getMonthReadingDays,
  getTodayReadingLog,
  getTotalReadDays,
  listMyBookOptions,
} from "@/lib/data";
import { todayDateString } from "@/lib/date";
import AuthGate from "@/components/AuthGate";
import ReadingCheckinForm from "@/components/ReadingCheckinForm";
import ReadingStatusCard from "@/components/ReadingStatusCard";

export default async function CalendarPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AuthGate
        title="독서 캘린더"
        description="로그인하면 매일 독서 기록을 남기고 연속 기록을 확인할 수 있어요."
      />
    );
  }

  const today = todayDateString();
  const [year, month] = today.split("-").map(Number);

  const todayLog = await getTodayReadingLog(user.id);
  const streak = await getCurrentStreak(user.id);
  const totalDaysRead = await getTotalReadDays(user.id);
  const monthDays = await getMonthReadingDays(user.id, year, month);
  const books = todayLog ? [] : await listMyBookOptions(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center">
      <div>
        <h1 className="text-3xl font-bold">독서 캘린더</h1>
        <p className="mt-1 text-muted">
          매일 기록을 남기고 연속 독서일을 쌓아보세요.
        </p>
      </div>

      {todayLog ? (
        <ReadingStatusCard
          status={todayLog.status}
          streak={streak}
          totalDaysRead={totalDaysRead}
          monthDays={monthDays}
          today={today}
        />
      ) : (
        <ReadingCheckinForm books={books} monthDays={monthDays} today={today} />
      )}
    </div>
  );
}
