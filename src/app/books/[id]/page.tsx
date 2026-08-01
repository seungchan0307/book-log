import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  getBookWithStats,
  getPublicReviewsForBook,
  getRatingDistribution,
  incrementBookViewCount,
  isBookInMyLibrary,
} from "@/lib/data";
import { StarDisplay } from "@/components/StarRating";
import BookDetailActions from "@/components/BookDetailActions";
import GenreFixPrompt from "@/components/GenreFixPrompt";
import PublicReviewList from "@/components/PublicReviewList";
import RatingDistribution from "@/components/RatingDistribution";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookId = Number(id);
  if (!Number.isInteger(bookId) || bookId <= 0) notFound();

  const user = await getCurrentUser();
  const book = await getBookWithStats(bookId, user?.id ?? null);
  if (!book) notFound();

  await incrementBookViewCount(bookId);
  const publicReviews = await getPublicReviewsForBook(bookId, user?.id ?? null);
  const ratingDistribution = await getRatingDistribution(bookId);
  const inLibrary = user ? await isBookInMyLibrary(bookId, user.id) : false;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <Link href="/library" className="text-sm text-muted hover:text-accent">
        ← 나의 서재로 돌아가기
      </Link>

      <div className="flex gap-5">
        <div className="flex h-40 w-28 shrink-0 items-center justify-center overflow-hidden rounded bg-card text-4xl text-muted">
          {book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover_url}
              alt={book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            "📖"
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{book.title}</h1>
            {book.genre && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                {book.genre}
              </span>
            )}
          </div>
          {!book.genre && user && <GenreFixPrompt bookId={book.id} />}
          {book.author && <p className="text-muted">{book.author}</p>}
          {book.avg_rating !== null ? (
            <div className="flex flex-col gap-2">
              <StarDisplay rating={book.avg_rating} size="text-lg" />
              <RatingDistribution distribution={ratingDistribution} />
            </div>
          ) : (
            <p className="text-sm text-muted">
              아직 평점이 없어요. 첫 번째로 별점을 남겨보세요.
            </p>
          )}
          {book.description && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
              {book.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <BookDetailActions
              book={book}
              isLoggedIn={Boolean(user)}
              inLibrary={inLibrary}
            />
            {book.purchase_url && (
              <a
                href={book.purchase_url}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-card"
              >
                책 사러가기
              </a>
            )}
          </div>
        </div>
      </div>

      {book.my_rating && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">내 감상</h2>
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <StarDisplay rating={book.my_rating} />
              <span className="text-xs text-muted">
                {book.my_review_is_public !== 0 ? "공개" : "비공개"}
              </span>
            </div>
            {book.my_review_content && (
              <p className="whitespace-pre-wrap text-sm">
                {book.my_review_content}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">
          다른 독자들의 감상 ({publicReviews.length})
        </h2>
        <PublicReviewList reviews={publicReviews} isLoggedIn={Boolean(user)} />
      </section>

      {book.purchase_url && (
        <p className="text-center text-xs text-muted">도서 정보 제공: 알라딘</p>
      )}
    </div>
  );
}
