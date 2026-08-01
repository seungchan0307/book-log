"use client";

const STORAGE_KEY = "book-log:theme";

// No React state: both icons are always in the DOM (identical on server and
// client, so hydration can't mismatch) and CSS decides which is visible,
// driven by the data-theme attribute the inline head script already set
// before first paint. See .theme-toggle-icon rules in globals.css.
export default function ThemeToggle() {
  function toggle() {
    const html = document.documentElement;
    const isDark =
      html.dataset.theme === "dark" ||
      (!html.dataset.theme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    html.dataset.theme = next;
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="다크 모드 전환"
      title="다크 모드 전환"
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm hover:bg-background"
    >
      <span aria-hidden="true" className="theme-toggle-icon-light">
        🌙
      </span>
      <span aria-hidden="true" className="theme-toggle-icon-dark">
        ☀️
      </span>
    </button>
  );
}
