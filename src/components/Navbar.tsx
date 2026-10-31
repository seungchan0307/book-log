import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logOut } from "@/app/actions/auth";
import { getUnusedGachaTicketCount } from "@/lib/data";
import Mark from "@/components/Mark";
import SettingsMenu from "@/components/SettingsMenu";

const NAV_LINKS = [
  { href: "/library", label: "서재" },
  { href: "/bookshelf", label: "책장" },
  { href: "/calendar", label: "독서 캘린더" },
  { href: "/stats", label: "통계" },
  { href: "/explore", label: "탐색" },
  { href: "/recommend", label: "추천" },
  { href: "/community", label: "이야기" },
] as const;

export default async function Navbar() {
  const user = await getCurrentUser();
  const ticketCount = user ? await getUnusedGachaTicketCount(user.id) : 0;

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <Mark />
        책갈피
      </Link>

      <nav className="order-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm w-full sm:order-none sm:w-auto sm:text-[0.9rem]">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
          >
            {link.label}
            {link.href === "/bookshelf" && ticketCount > 0 && (
              <span className="pill pill-accent px-1.5 py-0 text-[0.65rem] leading-[1.15rem]">
                {ticketCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            <Link href="/profile" className="font-semibold hover:text-accent">
              {user.nickname}님
            </Link>
            <form action={logOut}>
              <button type="submit" className="btn btn-outline btn-sm">
                로그아웃
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-outline btn-sm">
              로그인
            </Link>
            <Link href="/signup" className="btn btn-primary btn-sm">
              회원가입
            </Link>
          </>
        )}
        <div className="hidden md:block">
          <SettingsMenu />
        </div>
      </div>
      </div>
    </header>
  );
}
