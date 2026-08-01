export type User = {
  id: number;
  username: string;
  nickname: string;
  birthdate: string | null;
};

export type Book = {
  id: number;
  title: string;
  author: string | null;
  genre: string | null;
  cover_url: string | null;
  description: string | null;
  purchase_url: string | null;
  view_count: number;
  created_by: number | null;
  created_at: string;
};

export type BookReadingStatus = "finished" | "reading" | "want_to_read";

export type BookWithStats = Book & {
  avg_rating: number | null;
  review_count: number;
  my_rating: number | null;
  my_review_content: string | null;
  my_review_is_public: number | null;
  my_review_is_anonymous: number | null;
  my_reading_status: BookReadingStatus | null;
};

export type Review = {
  id: number;
  book_id: number;
  user_id: number;
  rating: number;
  content: string | null;
  is_public: number;
  is_anonymous: number;
  created_at: string;
  updated_at: string;
};

export type ReviewWithBook = Review & {
  book_title: string;
  book_author: string | null;
  book_cover_url: string | null;
};

export type PublicReview = Review & {
  reviewer_nickname: string;
  like_count: number;
  liked_by_me: number;
};

export type PopularReview = Review & {
  reviewer_nickname: string;
  book_title: string;
  book_author: string | null;
  book_cover_url: string | null;
  book_view_count: number;
  like_count: number;
  liked_by_me: number;
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

export type RatingDistributionRow = {
  star: number;
  count: number;
};

export type MonthlyReadingCount = {
  month: string;
  count: number;
};

export type GenreDistributionRow = {
  genre: string;
  count: number;
};
