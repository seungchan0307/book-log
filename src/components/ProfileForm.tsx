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
          className="field-input text-muted"
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
          className="field-input"
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
          className="field-input"
        />
      </div>
      {state.error && <p className="text-sm text-negative">{state.error}</p>}
      {state.success && <p className="text-sm text-accent">저장했어요.</p>}
      <button type="submit" disabled={pending} className="btn btn-primary self-start">
        {pending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
