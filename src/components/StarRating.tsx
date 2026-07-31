"use client";

import { useState } from "react";

export function StarDisplay({
  rating,
  size = "text-base",
}: {
  rating: number | null;
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
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(null)}
    >
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((n) => {
        const fillPercent = Math.max(0, Math.min(1, shown - (n - 1))) * 100;
        return (
          <span
            key={n}
            className="relative inline-block text-2xl leading-none"
          >
            <span className="text-border" aria-hidden="true">
              ★
            </span>
            <span
              className="absolute inset-0 overflow-hidden text-accent"
              style={{ width: `${fillPercent}%` }}
              aria-hidden="true"
            >
              ★
            </span>
            <button
              type="button"
              aria-label={`${n - 0.5}점`}
              onMouseEnter={() => setHover(n - 0.5)}
              onClick={() => setValue(n - 0.5)}
              className="absolute inset-y-0 left-0 w-1/2"
            />
            <button
              type="button"
              aria-label={`${n}점`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setValue(n)}
              className="absolute inset-y-0 right-0 w-1/2"
            />
          </span>
        );
      })}
      <span className="ml-1 text-sm text-muted">
        {value > 0 ? `${value}점` : "평점 선택"}
      </span>
    </div>
  );
}
