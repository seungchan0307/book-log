import type { CSSProperties } from "react";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type GachaItem = {
  key: string;
  name: string;
  rarity: Rarity;
  emoji: string;
};

export const RARITY_ORDER: Rarity[] = ["legendary", "epic", "rare", "common"];

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "일반",
  rare: "희귀",
  epic: "에픽",
  legendary: "레전더리",
};

// Weighted like a typical gacha: legendary is intentionally rare.
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

export const ITEM_POOL: GachaItem[] = [
  { key: "bookmark_paper", name: "종이 책갈피", rarity: "common", emoji: "🔖" },
  { key: "sticky_note", name: "포스트잇 메모", rarity: "common", emoji: "🗒️" },
  { key: "pencil", name: "몽당연필", rarity: "common", emoji: "✏️" },
  { key: "tea_bag", name: "홍차 티백", rarity: "common", emoji: "🍵" },
  { key: "dried_flower", name: "말린 들꽃", rarity: "common", emoji: "🌾" },
  { key: "candle", name: "작은 양초", rarity: "common", emoji: "🕯️" },
  { key: "reading_lamp", name: "독서등", rarity: "rare", emoji: "🪔" },
  { key: "leather_bookmark", name: "가죽 책갈피", rarity: "rare", emoji: "📑" },
  { key: "fountain_pen", name: "만년필", rarity: "rare", emoji: "🖋️" },
  { key: "wool_blanket", name: "무릎 담요", rarity: "rare", emoji: "🧣" },
  { key: "coffee_cup", name: "따뜻한 커피 한 잔", rarity: "rare", emoji: "☕" },
  { key: "antique_globe", name: "앤티크 지구본", rarity: "epic", emoji: "🌍" },
  { key: "pocket_watch", name: "회중시계", rarity: "epic", emoji: "⏱️" },
  { key: "vintage_camera", name: "빈티지 카메라", rarity: "epic", emoji: "📷" },
  { key: "music_box", name: "오르골", rarity: "epic", emoji: "🎵" },
  { key: "golden_quill", name: "황금 깃펜", rarity: "legendary", emoji: "🪶" },
  { key: "first_edition", name: "초판본", rarity: "legendary", emoji: "📜" },
  { key: "starlight_lantern", name: "별빛 램프", rarity: "legendary", emoji: "🏮" },
];

const POOL_BY_RARITY: Record<Rarity, GachaItem[]> = {
  common: ITEM_POOL.filter((i) => i.rarity === "common"),
  rare: ITEM_POOL.filter((i) => i.rarity === "rare"),
  epic: ITEM_POOL.filter((i) => i.rarity === "epic"),
  legendary: ITEM_POOL.filter((i) => i.rarity === "legendary"),
};

export function rollItem(): GachaItem {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let rarity: Rarity = "common";
  for (const r of RARITY_ORDER) {
    const weight = RARITY_WEIGHTS[r];
    if (roll < weight) {
      rarity = r;
      break;
    }
    roll -= weight;
  }
  const pool = POOL_BY_RARITY[rarity];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function findItem(itemKey: string): GachaItem | undefined {
  return ITEM_POOL.find((i) => i.key === itemKey);
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

// Card chrome escalates with rarity so a legendary pull visibly stands out
// on the shelf, not just in its label.
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

// A recessed "cubby" look for items resting on the wooden 책장 grid (see
// BookshelfClient) — inset shadow instead of a border, since the wood frame
// itself supplies the dividers between cells.
export function rarityShelfCellStyle(rarity: Rarity): CSSProperties {
  const accent = RARITY_ACCENTS[rarity];
  const inset = "inset 0 3px 7px rgba(0, 0, 0, 0.25)";
  if (rarity === "common") {
    return {
      background:
        "linear-gradient(180deg, var(--card), color-mix(in srgb, var(--card) 85%, black 15%))",
      boxShadow: inset,
    };
  }
  const glow =
    rarity === "legendary" ? `0 0 14px color-mix(in srgb, ${accent} 60%, transparent)`
    : rarity === "epic" ? `0 0 9px color-mix(in srgb, ${accent} 40%, transparent)`
    : "none";
  return {
    background: `linear-gradient(180deg, color-mix(in srgb, var(--card) 70%, ${accent} 30%), color-mix(in srgb, var(--card) 55%, ${accent} 45%))`,
    boxShadow: glow !== "none" ? `${inset}, ${glow}` : inset,
  };
}

export const EMPTY_SHELF_CELL_STYLE: CSSProperties = {
  background: "color-mix(in srgb, var(--card) 90%, black 10%)",
  boxShadow: "inset 0 3px 8px rgba(0, 0, 0, 0.18)",
};
