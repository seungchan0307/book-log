"use client";

import { useState, useTransition } from "react";
import { setBookGenre } from "@/app/actions/books";
import GenreSelect from "@/components/GenreSelect";

export default function GenreFixPrompt({ bookId }: { bookId: number }) {
  const [genreChoice, setGenreChoice] = useState("");
  const [customGenre, setCustomGenre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const resolvedGenre =
    genreChoice === "기타" ? customGenre.trim() : genreChoice;

  function handleSave() {
    if (!resolvedGenre) {
      setError("장르를 선택하거나 직접 입력해주세요.");
      return;
    }
    startTransition(async () => {
      const result = await setBookGenre(bookId, resolvedGenre);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setSaved(true);
    });
  }

  if (saved) {
    return <p className="text-xs text-muted">장르가 등록되었어요.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted">장르가 등록되지 않았어요.</span>
      <div className="w-40">
        <GenreSelect
          value={genreChoice}
          onChange={setGenreChoice}
          placeholder="장르 선택"
        />
      </div>
      {genreChoice === "기타" && (
        <input
          value={customGenre}
          onChange={(e) => setCustomGenre(e.target.value)}
          maxLength={20}
          placeholder="장르 직접 입력"
          className="w-36 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent"
        />
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-md border border-border px-2 py-1 text-xs hover:bg-card disabled:opacity-50"
      >
        {isPending ? "저장 중..." : "저장"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
