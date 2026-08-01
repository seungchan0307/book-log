"use client";

import SettingsToggleRow from "@/components/SettingsToggleRow";
import { isBgmEnabled, setBgmEnabled } from "@/lib/bgm";

const THEME_STORAGE_KEY = "book-log:theme";

function isDarkTheme() {
  return document.documentElement.dataset.theme === "dark";
}

function toggleTheme() {
  const next = isDarkTheme() ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
}

function toggleBgm() {
  setBgmEnabled(!isBgmEnabled());
}

export default function DisplaySettings() {
  return (
    <div className="flex flex-col gap-3">
      <SettingsToggleRow
        settingKey="theme"
        label="다크 모드"
        description="화면을 어둡게 표시해요"
        isOn={isDarkTheme}
        onToggle={toggleTheme}
      />
      <SettingsToggleRow
        settingKey="bgm"
        label="배경음악"
        description="잔잔한 배경음악을 재생해요"
        isOn={isBgmEnabled}
        onToggle={toggleBgm}
      />
    </div>
  );
}
