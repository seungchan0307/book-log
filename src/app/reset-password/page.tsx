import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/library");

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
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
  );
}
