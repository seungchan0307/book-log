import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import SignupForm from "@/components/SignupForm";
import AuthQuotePanel from "@/components/AuthQuotePanel";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/library");

  return (
    <div className="flex min-h-[calc(100svh-57px)]">
      <div className="flex w-full flex-col justify-center gap-6 px-4 py-16 md:w-auto md:flex-none md:basis-[480px]">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <h1 className="text-2xl font-bold">회원가입</h1>
          <SignupForm />
          <p className="text-sm text-muted">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-accent hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
      <AuthQuotePanel />
    </div>
  );
}
