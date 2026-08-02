import type { CSSProperties } from "react";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_ORDER: Rarity[] = ["legendary", "epic", "rare", "common"];

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "일반",
  rare: "희귀",
  epic: "에픽",
  legendary: "레전더리",
};

// Higher number = better. Used to decide whether a duplicate pull upgrades
// the copy already on the shelf (see pullGacha).
export const RARITY_RANK: Record<Rarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

// Weighted like a typical gacha: legendary is intentionally rare. The prize
// is always a real book picked at random from the catalog (see pullGacha) —
// this only decides how fancy that particular copy's edition is.
const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 55,
  rare: 30,
  epic: 10,
  legendary: 5,
};

// A 책장 shelf starts with one row and grows by spending 책갈피 토큰
// (earned via daily 독서 캘린더 check-ins, see submitReadingCheckin).
export const SHELF_ROW_SIZE = 8;
export const ROW_COST_TOKENS = 20;

export function rollRarity(): Rarity {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const r of RARITY_ORDER) {
    const weight = RARITY_WEIGHTS[r];
    if (roll < weight) return r;
    roll -= weight;
  }
  return "common";
}

// Accent hex per rarity, chosen to read clearly against both the light and
// dark theme's --card/--border (see globals.css) without needing separate
// dark-mode overrides — every derived style below mixes these with the
// theme's own CSS variables via color-mix(), so they track data-theme
// automatically instead of duplicating the site's light/dark rules.
const RARITY_ACCENTS: Record<Rarity, string> = {
  common: "var(--muted)",
  rare: "#0ea5e9",
  epic: "#a855f7",
  legendary: "#f59e0b",
};

// Reveal-modal card chrome escalates with rarity so a legendary pull
// visibly stands out, not just in its label.
export function rarityCardStyle(rarity: Rarity): CSSProperties {
  const accent = RARITY_ACCENTS[rarity];
  if (rarity === "common") {
    return { background: "var(--card)", borderColor: "var(--border)" };
  }
  const glow =
    rarity === "legendary" ? `0 0 18px color-mix(in srgb, ${accent} 55%, transparent)`
    : rarity === "epic" ? `0 0 10px color-mix(in srgb, ${accent} 35%, transparent)`
    : "none";
  return {
    background: `color-mix(in srgb, var(--card) 80%, ${accent} 20%)`,
    borderColor: `color-mix(in srgb, var(--border) 30%, ${accent} 70%)`,
    boxShadow: glow,
  };
}

export function rarityTextStyle(rarity: Rarity): CSSProperties {
  return { color: RARITY_ACCENTS[rarity] };
}

// Book-spine coloring for the shelf grid — a left-lit vertical gradient so
// it reads as a spine rather than a flat card. Epic/legendary layer an
// animated glow (see .spine-epic / .spine-legendary in globals.css) on top
// of this base color instead of a static shadow.
export function spineBackgroundStyle(rarity: Rarity): CSSProperties {
  const accent = RARITY_ACCENTS[rarity];
  if (rarity === "common") {
    return {
      background:
        "linear-gradient(90deg, color-mix(in srgb, var(--card) 80%, black 20%), var(--card))",
    };
  }
  return {
    background: `linear-gradient(90deg, color-mix(in srgb, var(--card) 55%, ${accent} 45%), color-mix(in srgb, var(--card) 75%, ${accent} 25%))`,
  };
}

// CSS class carrying the rarity's animated effect (empty string for
// common/rare, which stay static).
export function raritySpineEffectClass(rarity: Rarity): string {
  if (rarity === "epic") return "spine-epic";
  if (rarity === "legendary") return "spine-legendary";
  return "";
}
