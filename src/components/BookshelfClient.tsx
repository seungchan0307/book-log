"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pullGacha } from "@/app/actions/gacha";
import {
  RARITY_LABELS,
  findItem,
  rarityCardStyle,
  rarityTextStyle,
  type GachaItem,
} from "@/lib/gacha";
import type { BookshelfItem } from "@/lib/types";

type Phase = "idle" | "opening" | "revealed";

export default function BookshelfClient({
  ticketCount,
  items,
}: {
  ticketCount: number;
  items: BookshelfItem[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealed, setRevealed] = useState<GachaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePull() {
    if (phase !== "idle" || ticketCount <= 0) return;
    setError(null);
    setPhase("opening");
    startTransition(async () => {
      const result = await pullGacha();
      if ("error" in result) {
        setError(result.error);
        setPhase("idle");
        return;
      }
      // Let the shake animation play out before the reveal, so the pull
      // reads as a moment rather than an instant state swap.
      window.setTimeout(() => {
        setRevealed(result.item);
        setPhase("revealed");
      }, 900);
    });
  }

  function handleCloseReveal() {
    setPhase("idle");
    setRevealed(null);
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">책장</h1>
        <p className="text-muted">
          책을 다 읽을 때마다 뽑기권을 하나 받아요. 일반 → 희귀 → 에픽 →
          레전더리 순으로 점점 화려한 아이템이 나와요.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8">
        <div
          className={`flex h-28 w-28 items-center justify-center rounded-full border-4 border-accent text-5xl ${
            phase === "opening" ? "animate-[gacha-shake_0.9s_ease-in-out]" : ""
          }`}
        >
          🎁
        </div>
        <span className="text-sm text-muted">보유 뽑기권 {ticketCount}장</span>
        <button
          type="button"
          onClick={handlePull}
          disabled={ticketCount <= 0 || phase !== "idle" || isPending}
          className="rounded-md bg-accent px-6 py-2.5 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {phase === "opening" ? "뽑는 중..." : "뽑기"}
        </button>
        {ticketCount <= 0 && phase === "idle" && (
          <span className="text-xs text-muted">
            책을 다 읽으면 뽑기권을 받을 수 있어요.
          </span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">모은 아이템 ({items.length})</h2>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
            아직 뽑은 아이템이 없어요. 책을 읽고 첫 아이템을 뽑아보세요!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((bi) => {
              const item = findItem(bi.item_key);
              if (!item) return null;
              return (
                <div
                  key={bi.id}
                  className="flex flex-col items-center gap-1 rounded-lg border p-4 text-center"
                  style={rarityCardStyle(bi.rarity)}
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                  <span
                    className="text-xs font-semibold"
                    style={rarityTextStyle(bi.rarity)}
                  >
                    {RARITY_LABELS[bi.rarity]}
                  </span>
                  {bi.book_title && (
                    <span
                      className="truncate text-xs text-muted"
                      title={bi.book_title}
                    >
                      {bi.book_title}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {phase === "revealed" && revealed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="flex w-full max-w-xs animate-[gacha-pop_0.35s_ease-out] flex-col items-center gap-3 rounded-xl border p-8 text-center"
            style={rarityCardStyle(revealed.rarity)}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={rarityTextStyle(revealed.rarity)}
            >
              {RARITY_LABELS[revealed.rarity]}
            </span>
            <span className="text-6xl">{revealed.emoji}</span>
            <span className="text-lg font-bold">{revealed.name}</span>
            <button
              type="button"
              onClick={handleCloseReveal}
              className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              책장에 담기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
