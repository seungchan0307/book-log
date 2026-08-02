"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buyBookshelfRow, pullGacha } from "@/app/actions/gacha";
import {
  EMPTY_SHELF_CELL_STYLE,
  RARITY_LABELS,
  ROW_COST_TOKENS,
  SHELF_ROW_SIZE,
  findItem,
  rarityCardStyle,
  rarityShelfCellStyle,
  rarityTextStyle,
  type GachaItem,
} from "@/lib/gacha";
import type { BookshelfItem } from "@/lib/types";

type Phase = "idle" | "opening" | "revealed";

export default function BookshelfClient({
  ticketCount,
  items,
  bookmarkTokens,
  bookshelfRows,
}: {
  ticketCount: number;
  items: BookshelfItem[];
  bookmarkTokens: number;
  bookshelfRows: number;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealed, setRevealed] = useState<GachaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isBuying, startBuy] = useTransition();

  const capacity = bookshelfRows * SHELF_ROW_SIZE;
  const isFull = items.length >= capacity;

  function handlePull() {
    if (phase !== "idle" || ticketCount <= 0 || isFull) return;
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

  function handleBuyRow() {
    setBuyError(null);
    startBuy(async () => {
      const result = await buyBookshelfRow();
      if ("error" in result) {
        setBuyError(result.error);
        return;
      }
      router.refresh();
    });
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
          disabled={ticketCount <= 0 || phase !== "idle" || isPending || isFull}
          className="rounded-md bg-accent px-6 py-2.5 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {phase === "opening" ? "뽑는 중..." : "뽑기"}
        </button>
        {isFull && (
          <span className="text-xs text-muted">
            책장이 가득 찼어요. 아래에서 책갈피 토큰으로 칸을 늘려보세요.
          </span>
        )}
        {!isFull && ticketCount <= 0 && phase === "idle" && (
          <span className="text-xs text-muted">
            책을 다 읽으면 뽑기권을 받을 수 있어요.
          </span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            모은 아이템 ({items.length}/{capacity})
          </h2>
          <span className="text-sm text-muted">
            책갈피 토큰 {bookmarkTokens}개
          </span>
        </div>
        {/* Wooden 책장 frame: one visual shelf level per purchased row of 8
            (SHELF_ROW_SIZE), stacked with a plank-like divider between
            levels so buying a row reads as "adding a shelf", not just
            growing an abstract grid. */}
        <div
          className="flex flex-col gap-3 rounded-2xl p-3 sm:p-4"
          style={{
            background: "linear-gradient(180deg, #8b5e34, #6b4423)",
            boxShadow:
              "inset 0 2px 6px rgba(0, 0, 0, 0.35), 0 6px 14px rgba(0, 0, 0, 0.2)",
          }}
        >
          {Array.from({ length: bookshelfRows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-4 gap-2 rounded-lg p-2"
              style={{ background: "rgba(0, 0, 0, 0.12)" }}
            >
              {Array.from({ length: SHELF_ROW_SIZE }).map((_, colIndex) => {
                const bi = items[rowIndex * SHELF_ROW_SIZE + colIndex];
                if (!bi) {
                  return (
                    <div
                      key={`empty-${rowIndex}-${colIndex}`}
                      className="flex aspect-square items-center justify-center rounded-md"
                      style={EMPTY_SHELF_CELL_STYLE}
                    />
                  );
                }
                const item = findItem(bi.item_key);
                if (!item) return null;
                return (
                  <div
                    key={bi.id}
                    className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md p-1 text-center"
                    style={rarityShelfCellStyle(bi.rarity)}
                    title={bi.book_title ?? undefined}
                  >
                    <span className="text-xl sm:text-2xl">{item.emoji}</span>
                    <span className="w-full truncate text-[0.6rem] font-medium sm:text-xs">
                      {item.name}
                    </span>
                    <span
                      className="text-[0.55rem] font-semibold sm:text-[0.65rem]"
                      style={rarityTextStyle(bi.rarity)}
                    >
                      {RARITY_LABELS[bi.rarity]}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border p-4">
          <span className="text-sm text-muted">
            책갈피 토큰 {ROW_COST_TOKENS}개로 8칸짜리 줄을 하나 더 늘릴 수
            있어요.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBuyRow}
              disabled={isBuying || bookmarkTokens < ROW_COST_TOKENS}
              className="rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBuying ? "늘리는 중..." : `줄 추가 (${ROW_COST_TOKENS}개)`}
            </button>
          </div>
        </div>
        {buyError && <span className="text-sm text-red-600">{buyError}</span>}
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
