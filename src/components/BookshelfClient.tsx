"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buyBookshelfRow, pullGacha, type PullGachaResult } from "@/app/actions/gacha";
import {
  RARITY_LABELS,
  ROW_COST_TOKENS,
  SHELF_ROW_SIZE,
  raritySpineEffectClass,
  rarityCardStyle,
  rarityGemStyle,
  rarityTextStyle,
  spineBackgroundStyle,
} from "@/lib/gacha";
import type { BookshelfItem } from "@/lib/types";

type Phase = "idle" | "opening" | "revealed";
type RevealedPull = Extract<PullGachaResult, { book: unknown }>;

// Every spine is the same thickness — real bookshelves don't resize books
// to fit, and neither does this one.
const SPINE_WIDTH = 38;

function BookSpine({
  item,
  onClick,
}: {
  item: BookshelfItem;
  onClick: () => void;
}) {
  const title = item.book_title ?? item.item_key;
  return (
    <button
      type="button"
      onClick={onClick}
      title={item.book_author ? `${title} · ${item.book_author}` : title}
      aria-label={title}
      className={`relative h-32 shrink-0 overflow-hidden rounded-t-sm transition-transform hover:-translate-y-1 ${raritySpineEffectClass(item.rarity)}`}
      style={{ width: SPINE_WIDTH, ...spineBackgroundStyle(item.rarity) }}
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
        style={{
          background: "linear-gradient(90deg, rgba(255,255,255,0.35), transparent)",
        }}
      />
      <span
        className="pointer-events-none absolute inset-x-1 top-3 h-[2px] rounded-full"
        style={{ background: "rgba(0,0,0,0.25)" }}
      />
      <span
        className="pointer-events-none absolute inset-x-1 bottom-3 h-[2px] rounded-full"
        style={{ background: "rgba(0,0,0,0.25)" }}
      />
      <span
        className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={rarityGemStyle(item.rarity)}
      />
    </button>
  );
}

function BookCoverBlock({
  title,
  author,
  coverUrl,
}: {
  title: string;
  author: string | null;
  coverUrl: string | null;
}) {
  return (
    <>
      {coverUrl ? (
        <div className="relative h-32 w-20 overflow-hidden rounded shadow-md">
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      ) : (
        <span className="text-6xl">📖</span>
      )}
      <span className="text-lg font-bold">{title}</span>
      {author && <span className="text-sm text-muted">{author}</span>}
    </>
  );
}

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
  const [revealed, setRevealed] = useState<RevealedPull | null>(null);
  const [selected, setSelected] = useState<BookshelfItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isBuying, startBuy] = useTransition();

  const capacity = bookshelfRows * SHELF_ROW_SIZE;

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
        setRevealed(result);
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
          책을 다 읽을 때마다 뽑기권을 하나 받아요. 어떤 책이 나올지는
          완전히 무작위이고, 등급은 일반 → 희귀 → 에픽 → 레전더리 순으로
          점점 화려해져요. 이미 있는 책이 다시 나오면 더 높은 등급일 때만
          업그레이드돼요. 책장의 책을 누르면 무슨 책인지 볼 수 있어요.
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            내 책장 ({items.length}/{capacity})
          </h2>
          <span className="text-sm text-muted">
            책갈피 토큰 {bookmarkTokens}개
          </span>
        </div>

        {/* Wooden 책장 frame: one physical shelf level per purchased row of
            8, each rendered as a row of book spines standing on a plank. */}
        <div
          className="flex flex-col gap-4 rounded-2xl p-3 sm:p-4"
          style={{
            background: "linear-gradient(180deg, #8b5e34, #6b4423)",
            boxShadow:
              "inset 0 2px 6px rgba(0, 0, 0, 0.35), 0 6px 14px rgba(0, 0, 0, 0.2)",
          }}
        >
          {Array.from({ length: bookshelfRows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex flex-col">
              <div className="flex min-h-[8.5rem] items-end justify-center gap-[3px] overflow-hidden px-1">
                {Array.from({ length: SHELF_ROW_SIZE }).map((_, colIndex) => {
                  const bi = items[rowIndex * SHELF_ROW_SIZE + colIndex];
                  if (!bi) {
                    return (
                      <div
                        key={`empty-${rowIndex}-${colIndex}`}
                        className="h-32 shrink-0 rounded-t-sm border border-dashed"
                        style={{
                          width: SPINE_WIDTH,
                          borderColor: "rgba(255, 255, 255, 0.22)",
                        }}
                      />
                    );
                  }
                  return (
                    <BookSpine
                      key={bi.id}
                      item={bi}
                      onClick={() => setSelected(bi)}
                    />
                  );
                })}
              </div>
              {/* Shelf plank */}
              <div
                className="h-3 rounded-sm"
                style={{
                  background: "linear-gradient(180deg, #a9743f, #6b4423)",
                  boxShadow:
                    "0 3px 5px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border p-4">
          <span className="text-sm text-muted">
            책갈피 토큰 {ROW_COST_TOKENS}개로 8칸짜리 줄을 하나 더 늘릴 수
            있어요.
          </span>
          <button
            type="button"
            onClick={handleBuyRow}
            disabled={isBuying || bookmarkTokens < ROW_COST_TOKENS}
            className="rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBuying ? "늘리는 중..." : `줄 추가 (${ROW_COST_TOKENS}개)`}
          </button>
        </div>
        {buyError && <span className="text-sm text-red-600">{buyError}</span>}
      </div>

      {phase === "revealed" && revealed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className={`flex w-full max-w-xs animate-[gacha-pop_0.35s_ease-out] flex-col items-center gap-3 rounded-xl border p-8 text-center ${raritySpineEffectClass(revealed.rarity)}`}
            style={rarityCardStyle(revealed.rarity)}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={rarityTextStyle(revealed.rarity)}
            >
              {RARITY_LABELS[revealed.rarity]}
            </span>
            <BookCoverBlock
              title={revealed.book.title}
              author={revealed.book.author}
              coverUrl={revealed.book.cover_url}
            />
            {revealed.duplicate && (
              <span className="text-sm text-muted">
                {revealed.upgraded
                  ? `이미 있던 책이 ${RARITY_LABELS[revealed.previousRarity!]} → ${RARITY_LABELS[revealed.rarity]}(으)로 승급했어요 🎉`
                  : `이미 책장에 있는 책이에요. 기존 ${RARITY_LABELS[revealed.previousRarity!]} 등급이 더 높아 그대로 유지돼요.`}
              </span>
            )}
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

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className={`flex w-full max-w-xs flex-col items-center gap-3 rounded-xl border p-8 text-center ${raritySpineEffectClass(selected.rarity)}`}
            style={rarityCardStyle(selected.rarity)}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={rarityTextStyle(selected.rarity)}
            >
              {RARITY_LABELS[selected.rarity]}
            </span>
            <BookCoverBlock
              title={selected.book_title ?? selected.item_key}
              author={selected.book_author}
              coverUrl={selected.book_cover_url}
            />
            <div className="mt-2 flex gap-2">
              {selected.book_id && (
                <Link
                  href={`/books/${selected.book_id}`}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-background"
                >
                  책 상세보기
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
