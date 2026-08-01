"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  resetPassword,
  type ResetPasswordFormState,
} from "@/app/actions/auth";

const initialState: ResetPasswordFormState = {};

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState(
    resetPassword,
    initialState
  );

  if (state.success) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-center">
        <p>비밀번호가 변경됐어요.</p>
        <Link
          href="/login"
          className="self-center rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90"
        >
          로그인하러 가기
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm font-medium">
          아이디
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
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
          required
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-accent"
        />
        <span className="text-xs text-muted">
          가입 시 (또는 프로필에서) 등록한 생년월일과 일치해야 해요.
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="new_password" className="text-sm font-medium">
          새 비밀번호
        </label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          required
          minLength={8}
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirm_password" className="text-sm font-medium">
          새 비밀번호 확인
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-accent"
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
