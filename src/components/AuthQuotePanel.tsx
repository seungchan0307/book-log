import { connection } from "next/server";
import { QUOTES } from "@/lib/quotes";

// Closes the right half of the login/signup screen with the same voice the
// home hero uses, instead of leaving it empty beside a narrow form.
export default async function AuthQuotePanel() {
  await connection(); // ensure the random pick below is per-request
  // eslint-disable-next-line react-hooks/purity -- intentional per-request randomness, guarded by connection() above
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  return (
    <div className="hidden flex-1 items-center justify-center bg-card px-16 md:flex">
      <blockquote className="max-w-md">
        <p className="text-2xl font-semibold leading-relaxed text-foreground">
          “{quote.text}”
        </p>
        <p className="mt-3 text-sm text-muted">
          {quote.book} <span className="mx-1">·</span> {quote.author}
        </p>
      </blockquote>
    </div>
  );
}
