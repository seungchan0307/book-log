import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import AuthQuotePanel from "@/components/AuthQuotePanel";

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/library");

  return (
    <div className="flex min-h-[calc(100svh-57px)]">
      <div className="flex w-full flex-col justify-center gap-6 px-4 py-16 md:w-auto md:flex-none md:basis-[480px]">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold">비밀번호 재설정</h1>
            <p className="mt-1 text-muted">
              아이디와 생년월일로 본인을 확인하고 새 비밀번호를 설정하세요.
            </p>
          </div>
          <ResetPasswordForm />
          <p className="text-sm text-muted">
            <Link href="/login" className="text-accent hover:underline">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
      <AuthQuotePanel />
    </div>
  );
}
