// 책갈피(bookmark)라는 이름 그대로: 책장에 꽂힌 책 사이로 삐져나온 리본 책갈피.
export default function Mark() {
  return (
    <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h10a1 1 0 0 1 1 1v16.2a.8.8 0 0 1-1.24.667L12 17.1l-4.76 3.767A.8.8 0 0 1 6 20.2V4a1 1 0 0 1 1-1Z"
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
