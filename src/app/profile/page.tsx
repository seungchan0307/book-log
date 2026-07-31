import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold">프로필</h1>
      <ProfileForm user={user} />
    </div>
  );
}
