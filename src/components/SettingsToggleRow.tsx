"use client";

import { useEffect, useRef } from "react";

// The on/off visual (track color + thumb position) is driven purely by CSS,
// keyed off a data-* attribute on <html> (see .settings-switch-* rules in
// globals.css) — the same trick ThemeToggle used to avoid this ever needing
// React state that could mismatch between server and client render.
export default function SettingsToggleRow({
  settingKey,
  label,
  description,
  isOn,
  onToggle,
}: {
  settingKey: "theme" | "bgm";
  label: string;
  description: string;
  isOn: () => boolean;
  onToggle: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.setAttribute("aria-checked", String(isOn()));
  }, [isOn]);

  function handleClick() {
    onToggle();
    buttonRef.current?.setAttribute("aria-checked", String(isOn()));
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <button
        ref={buttonRef}
        type="button"
        role="switch"
        aria-checked="false"
        aria-label={label}
        onClick={handleClick}
        data-switch-for={settingKey}
        className="settings-switch-track relative h-6 w-11 shrink-0 rounded-full bg-border transition-colors"
      >
        <span
          data-switch-for={settingKey}
          className="settings-switch-thumb absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
        />
      </button>
    </div>
  );
}
