import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { listMyBooksWithStats, listMyReviews } from "@/lib/data";
import LibraryClient from "@/components/LibraryClient";

export default async function LibraryPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">나의 서재</h1>
        <p className="text-muted">
          로그인하면 책을 등록하고 감상을 남길 수 있어요.
        </p>
        <Link
          href="/login"
          className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:opacity-90"
        >
          로그인
        </Link>
      </div>
    );
  }

  const books = await listMyBooksWithStats(user.id);
  const myReviews = await listMyReviews(user.id);

  return <LibraryClient books={books} myReviews={myReviews} />;
}
