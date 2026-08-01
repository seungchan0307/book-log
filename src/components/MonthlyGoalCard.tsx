"use client";

import { useState, useTransition } from "react";
import { setMonthlyGoal } from "@/app/actions/stats";

export default function MonthlyGoalCard({
  currentCount,
  goal,
}: {
  currentCount: number;
  goal: number | null;
}) {
  const [editing, setEditing] = useState(goal === null);
  const [value, setValue] = useState(String(goal ?? 3));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const target = Number(value);
    if (!Number.isInteger(target) || target < 1 || target > 100) {
      setError("1~100 사이의 숫자를 입력해주세요.");
      return;
    }
    startTransition(async () => {
      const result = await setMonthlyGoal(target);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
        <span className="text-sm font-medium">이번 달 목표 설정</span>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            max={100}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-20 rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
          <span className="text-sm text-muted">권 읽기</span>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "저장 중..." : "설정"}
          </button>
        </div>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    );
  }

  const target = goal ?? 0;
  const pct = target > 0 ? Math.min(100, (currentCount / target) * 100) : 0;
  const achieved = target > 0 && currentCount >= target;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          이번 달 목표: {target}권 중 {currentCount}권
          {achieved && " 달성!"}
        </span>
        <button
          type="button"
          onClick={() => {
            setValue(String(target));
            setEditing(true);
          }}
          className="text-xs text-muted hover:text-accent"
        >
          수정
        </button>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
