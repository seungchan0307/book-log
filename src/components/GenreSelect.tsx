"use client";

import { useMemo, useState } from "react";
import { GENRES } from "@/lib/genres";

export default function GenreSelect({
  value,
  onChange,
  placeholder = "장르 검색",
  clearLabel = "선택 안 함",
}: {
  value: string;
  onChange: (genre: string) => void;
  placeholder?: string;
  clearLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GENRES;
    return GENRES.filter((g) => g.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="relative">
      <input
        value={open ? query : value}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-card p-1 shadow-lg">
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-sm text-muted hover:bg-background"
            >
              {clearLabel}
            </button>
          </li>
          {filtered.length === 0 ? (
            <li className="px-2 py-1.5 text-sm text-muted">
              일치하는 장르가 없어요.
            </li>
          ) : (
            filtered.map((g) => (
              <li key={g}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(g);
                    setOpen(false);
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-background"
                >
                  {g}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
