"use client";

import { useState } from "react";

export function StarDisplay({
  rating,
  reviewCount,
  size = "text-base",
}: {
  rating: number | null;
  reviewCount?: number;
  size?: string;
}) {
  const fillPercent = rating ? Math.max(0, Math.min(100, (rating / 5) * 100)) : 0;

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span
        className={`relative inline-block ${size} leading-none whitespace-nowrap`}
        aria-label={`평점 ${rating !== null ? rating.toFixed(2) : "없음"}점`}
      >
        <span className="text-border" aria-hidden="true">
          ★★★★★
        </span>
        <span
          className="absolute inset-0 overflow-hidden text-accent"
          style={{ width: `${fillPercent}%` }}
          aria-hidden="true"
        >
          ★★★★★
        </span>
      </span>
      <span className="text-muted">
        {rating !== null ? rating.toFixed(2) : "0.00"}
        {reviewCount !== undefined && <> · {reviewCount}명 평가</>}
      </span>
    </div>
  );
}

export function StarPicker({
  name,
  defaultValue = 0,
}: {
  name: string;
  defaultValue?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}점`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => setValue(n)}
          className="text-2xl leading-none text-accent transition-transform hover:scale-110"
        >
          {n <= shown ? "★" : <span className="text-border">★</span>}
        </button>
      ))}
      <span className="ml-1 text-sm text-muted">{value > 0 ? `${value}점` : "평점 선택"}</span>
    </div>
  );
}
