import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/library");

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold">로그인</h1>
      <LoginForm />
      <p className="text-sm text-muted">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
