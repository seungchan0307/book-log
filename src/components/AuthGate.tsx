import Link from "next/link";

export default function AuthGate({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted">{description}</p>
      <Link href="/login" className="btn btn-primary">
        로그인
      </Link>
    </div>
  );
}
