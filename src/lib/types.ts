export type User = {
  id: number;
  email: string;
  nickname: string;
};

export type Book = {
  id: number;
  title: string;
  author: string | null;
  genre: string | null;
  cover_url: string | null;
  description: string | null;
  purchase_url: string | null;
  created_by: number | null;
  created_at: string;
};

export type BookWithStats = Book & {
  avg_rating: number | null;
  review_count: number;
  my_rating: number | null;
  my_review_content: string | null;
  my_review_is_public: number | null;
};

export type Review = {
  id: number;
  book_id: number;
  user_id: number;
  rating: number;
  content: string | null;
  is_public: number;
  created_at: string;
  updated_at: string;
};

export type ReviewWithBook = Review & {
  book_title: string;
  book_author: string | null;
};

export type PublicReview = Review & {
  reviewer_nickname: string;
};

export type ReadingLogStatus = "read" | "skipped";

export type ReadingLog = {
  id: number;
  user_id: number;
  log_date: string;
  status: ReadingLogStatus;
  book_id: number | null;
  custom_title: string | null;
  created_at: string;
};

export type BookOption = {
  id: number;
  title: string;
  author: string | null;
};

export type DayStatus = {
  date: string;
  status: ReadingLogStatus | null;
};
