import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logOut } from "@/app/actions/auth";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-accent">
          책갈피
        </Link>
        <nav className="flex items-center gap-4 text-base">
          <Link href="/library" className="hover:text-accent">
            서재
          </Link>
          <Link href="/calendar" className="hover:text-accent">
            독서 캘린더
          </Link>
          <Link href="/explore" className="hover:text-accent">
            탐색
          </Link>
          <Link href="/recommend" className="hover:text-accent">
            추천
          </Link>
          {user ? (
            <>
              <Link
                href="/profile"
                className="font-semibold text-muted hover:text-accent"
              >
                {user.nickname}님
              </Link>
              <form action={logOut}>
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-1.5 hover:bg-background"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-border px-3 py-1.5 hover:bg-background"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-accent px-3 py-1.5 text-accent-foreground hover:opacity-90"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
