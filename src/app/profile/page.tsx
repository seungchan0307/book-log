import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import DisplaySettings from "@/components/DisplaySettings";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-8 px-4 py-16">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">프로필</h1>
        <ProfileForm user={user} />
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">화면 설정</h2>
        <DisplaySettings />
      </div>
    </div>
  );
}
