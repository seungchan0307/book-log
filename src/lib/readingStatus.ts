export type ReadingStatus = "finished" | "reading" | "want_to_read";

export function parseReadingStatus(raw: string): ReadingStatus {
  return raw === "reading" || raw === "want_to_read" ? raw : "finished";
}

// 다 읽은 책은 평점이 필수. 읽는 중/읽을 예정은 아직 감상을 남길 단계가
// 아니라서 평점이 선택이지만, 그래도 남기기로 했다면 형식은 유효해야 함.
export function validateReadingSubmission(
  readingStatus: ReadingStatus,
  rating: number,
  content: string
): string | null {
  if (readingStatus === "finished") {
    if (
      !Number.isFinite(rating) ||
      rating < 0.5 ||
      rating > 5 ||
      !Number.isInteger(rating * 2)
    ) {
      return "평점을 선택해주세요.";
    }
  } else if (
    rating !== 0 &&
    (rating < 0.5 || rating > 5 || !Number.isInteger(rating * 2))
  ) {
    return "평점은 0.5~5점 사이에서 0.5점 단위로 선택해주세요.";
  }
  if (content.length > 4000) {
    return "감상평은 4000자 이내로 작성해주세요.";
  }
  return null;
}
