import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { QUOTES } from "@/lib/quotes";

export default async function Home() {
  const user = await getCurrentUser();
  await connection(); // ensure the random quote below is picked per-request
  // eslint-disable-next-line react-hooks/purity -- intentional per-request randomness, guarded by connection() above
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pb-24 pt-[4.5cm] text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        읽은 책을, <span className="text-accent">기록</span>하고{" "}
        <span className="text-accent">나누다</span>
      </h1>

      {user ? (
        <p className="text-xl font-medium text-accent">
          <span className="font-extrabold">{user.nickname}</span>님, 오늘도 좋은 책
          만나보세요
        </p>
      ) : (
        <p className="max-w-xl text-xl text-muted">
          책갈피는 내가 읽은 책의 감상과 평점을 남기고, 취향이 비슷한 사람들의
          추천을 받아보는 독서 기록장입니다.
        </p>
      )}

      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-muted">
        <span>매일 읽은 기록을 남기고</span>
        <span aria-hidden="true">·</span>
        <span>별점으로 내 취향을 쌓고</span>
        <span aria-hidden="true">·</span>
        <span>꾸준한 독서 습관을 만들어요</span>
      </p>

      <div className="flex max-w-xl flex-col items-center gap-2">
        <p className="text-xl font-semibold leading-relaxed">
          “{quote.text}”
        </p>
        <p className="text-base font-medium text-foreground">
          - {quote.book} <span className="text-xl">·</span> {quote.author} -
        </p>
      </div>

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
