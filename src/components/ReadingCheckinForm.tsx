"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReadingCheckin } from "@/app/actions/reading";
import ReadingStatusCard from "@/components/ReadingStatusCard";
import MonthCalendar from "@/components/MonthCalendar";
import type { BookOption, DayStatus, ReadingLogStatus } from "@/lib/types";

export default function ReadingCheckinForm({
  books,
  monthDays,
  today,
}: {
  books: BookOption[];
  monthDays: DayStatus[];
  today: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"ask" | "book">("ask");
  const [bookId, setBookId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    status: ReadingLogStatus;
    streak: number;
    totalDaysRead: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(status: ReadingLogStatus) {
    setError(null);
    startTransition(async () => {
      const result = await submitReadingCheckin(
        status,
        status === "read" && bookId ? Number(bookId) : null,
        status === "read" ? customTitle : null
      );
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone({
        status: result.status,
        streak: result.streak,
        totalDaysRead: result.totalDaysRead,
      });
      router.refresh();
    });
  }

  if (done) {
    const updatedDays = monthDays.map((d) =>
      d.date === today ? { ...d, status: done.status } : d
    );
    return (
      <ReadingStatusCard
        status={done.status}
        streak={done.streak}
        totalDaysRead={done.totalDaysRead}
        monthDays={updatedDays}
        today={today}
      />
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-5 rounded-lg border border-border bg-card p-6">
      <MonthCalendar days={monthDays} today={today} />

      {step === "ask" ? (
        <>
          <p className="text-lg font-semibold">오늘도 책 읽으셨나요?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("book")}
              className="rounded-md bg-accent px-5 py-2 font-medium text-accent-foreground hover:opacity-90"
            >
              읽음
            </button>
            <button
              onClick={() => submit("skipped")}
              disabled={isPending}
              className="rounded-md border border-border px-5 py-2 font-medium hover:bg-background disabled:opacity-50"
            >
              읽지 않음
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold">어떤 책을 읽으셨나요?</p>
          <div className="flex w-full flex-col gap-2">
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
            >
              <option value="">목록에 없어요 (직접 입력)</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                  {b.author ? ` · ${b.author}` : ""}
                </option>
              ))}
            </select>
            {!bookId && (
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="읽은 책 제목을 입력해주세요"
                maxLength={200}
                className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
              />
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("ask")}
              className="rounded-md border border-border px-5 py-2 font-medium hover:bg-background"
            >
              뒤로
            </button>
            <button
              onClick={() => submit("read")}
              disabled={isPending || (!bookId && !customTitle.trim())}
              className="rounded-md bg-accent px-5 py-2 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "기록 중..." : "기록하기"}
            </button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
