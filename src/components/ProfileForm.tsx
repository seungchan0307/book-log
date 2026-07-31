"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileFormState } from "@/app/actions/profile";
import type { User } from "@/lib/types";

const initialState: ProfileFormState = {};

export default function ProfileForm({ user }: { user: User }) {
  const [state, action, pending] = useActionState(
    updateProfile,
    initialState
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">아이디</label>
        <input
          value={user.username}
          disabled
          className="rounded-md border border-border bg-background px-3 py-2 text-muted"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nickname" className="text-sm font-medium">
          닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          defaultValue={user.nickname}
          required
          maxLength={20}
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="birthdate" className="text-sm font-medium">
          생년월일
        </label>
        <input
          id="birthdate"
          name="birthdate"
          type="date"
          defaultValue={user.birthdate ?? ""}
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-accent"
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-accent">저장했어요.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
