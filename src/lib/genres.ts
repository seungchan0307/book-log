export const GENRES = [
  "소설",
  "시/에세이",
  "인문",
  "사회과학",
  "자기계발",
  "경제/경영",
  "역사",
  "과학",
  "예술",
  "만화/라이트노벨",
  "아동/청소년",
  "기타",
] as const;

export type Genre = (typeof GENRES)[number];
