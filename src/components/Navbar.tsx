import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logOut } from "@/app/actions/auth";
import SettingsMenu from "@/components/SettingsMenu";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-accent sm:text-xl"
        >
          책갈피
        </Link>
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:gap-4 sm:text-base">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-4">
            <Link href="/library" className="hover:text-accent">
              나의 서재
            </Link>
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <Link href="/calendar" className="hover:text-accent">
              독서 캘린더
            </Link>
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <Link href="/stats" className="hover:text-accent">
              통계
            </Link>
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <Link href="/explore" className="hover:text-accent">
              탐색
            </Link>
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <Link href="/recommend" className="hover:text-accent">
              추천
            </Link>
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <Link href="/community" className="hover:text-accent">
              이야기
            </Link>
          </div>
          {user ? (
            <>
              <span className="text-border" aria-hidden="true">
                /
              </span>
              <Link
                href="/profile"
                className="font-bold text-foreground hover:text-accent"
              >
                {user.nickname}님
              </Link>
              <form action={logOut}>
                <button
                  type="submit"
                  className="rounded-md border border-border px-2.5 py-1 hover:bg-background sm:px-3 sm:py-1.5"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-border px-2.5 py-1 hover:bg-background sm:px-3 sm:py-1.5"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-accent px-2.5 py-1 text-accent-foreground hover:opacity-90 sm:px-3 sm:py-1.5"
              >
                회원가입
              </Link>
            </>
          )}
          <div className="hidden items-center gap-x-3 md:flex sm:gap-x-4">
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <SettingsMenu />
          </div>
        </nav>
      </div>
    </header>
  );
}
