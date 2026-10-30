"use client";

import { useEffect, useRef, useState } from "react";
import DisplaySettings from "@/components/DisplaySettings";

// Desktop-only dropdown for 다크 모드 / 배경음악 in the navbar's top-right
// corner. On mobile these stay on the profile page instead (see
// src/app/profile/page.tsx) — there's no room for a dropdown in the
// collapsed mobile nav.
export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="화면 설정"
        aria-expanded={open}
        className="btn btn-outline btn-sm"
      >
        설정
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-md border border-border bg-card p-3 shadow-lg">
          <DisplaySettings />
        </div>
      )}
    </div>
  );
}
