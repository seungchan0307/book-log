import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import BackgroundMusicController from "@/components/BackgroundMusicController";
import Navbar from "@/components/Navbar";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 우리들의 독서 기록장`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ["책갈피", "독서 기록", "독서 앱", "독서 다이어리", "책 추천", "독서 커뮤니티", "책 리뷰"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 우리들의 독서 기록장`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — 우리들의 독서 기록장`,
    description: SITE_DESCRIPTION,
  },
};

// Reads the saved theme (or falls back to the OS setting) and the saved
// background-music preference, applying both to <html> before first paint —
// so there's no flash of the wrong theme, and the settings-switch CSS in
// globals.css always has a correct data-* attribute to key off. Must run as
// beforeInteractive, inline, in the root layout.
const SITE_INIT_SCRIPT = `
(function () {
  try {
    var storedTheme = localStorage.getItem("book-log:theme");
    var theme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;

    document.documentElement.dataset.bgm =
      localStorage.getItem("book-log:bgm") === "on" ? "on" : "off";
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="site-init" strategy="beforeInteractive">
          {SITE_INIT_SCRIPT}
        </Script>
        <BackgroundMusicController />
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
