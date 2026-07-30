import Link from "next/link";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-24 pt-[4.5cm] text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        읽은 책을, <span className="text-accent">기록</span>하고{" "}
        <span className="text-accent">나누다</span>
      </h1>

      {user ? (
        <p className="text-xl font-medium text-accent">
          {user.nickname}님, 오늘도 좋은 책 만나보세요
        </p>
      ) : (
        <p className="max-w-xl text-xl text-muted">
          책갈피는 내가 읽은 책의 감상과 평점을 남기고, 취향이 비슷한 사람들의
          추천을 받아보는 독서 기록장입니다.
        </p>
      )}

      <ul className="flex flex-col items-center gap-1.5 text-muted">
        <li>매일 읽은 기록을 남기고</li>
        <li>별점으로 내 취향을 쌓고</li>
        <li>꾸준한 독서 습관을 만들어요</li>
      </ul>

      <div className="flex gap-3">
        {user ? (
          <>
            <Link
              href="/library"
              className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:opacity-90"
            >
              내 서재로 가기
            </Link>
            <Link
              href="/recommend"
              className="rounded-md border border-border px-5 py-2.5 font-medium hover:bg-card"
            >
              추천 보러 가기
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/signup"
              className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:opacity-90"
            >
              시작하기
            </Link>
            <Link
              href="/recommend"
              className="rounded-md border border-border px-5 py-2.5 font-medium hover:bg-card"
            >
              추천 도서 보러가기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
