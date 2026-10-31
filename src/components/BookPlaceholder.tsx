// Drawn in place of a missing cover: a plain closed book, flat, in the
// product's own ink — used everywhere a book has no cover_url yet instead of
// the 📖 emoji (renders inconsistently across platforms, reads as a filler).
export default function BookPlaceholder({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M6 7.5C6 6.12 7.12 5 8.5 5H16v22H8.5A2.5 2.5 0 0 1 6 24.5v-17Z"
        fill="var(--accent-soft)"
        stroke="var(--border)"
        strokeWidth="1.2"
      />
      <path
        d="M26 7.5C26 6.12 24.88 5 23.5 5H16v22h7.5a2.5 2.5 0 0 0 2.5-2.5v-17Z"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="1.2"
      />
      <path d="M16 5v22" stroke="var(--border)" strokeWidth="1.2" />
    </svg>
  );
}
