"use client";

import { useActionState } from "react";
import { signUp, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

export default function SignupForm() {
  const [state, action, pending] = useActionState(signUp, initialState);

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
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          className="field-input"
        />
        <span className="text-xs text-muted">
          영문/숫자/밑줄(_)로 3~20자로 입력해주세요.
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nickname" className="text-sm font-medium">
          닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          maxLength={20}
          className="field-input"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="field-input"
        />
        <span className="text-xs text-muted">8자 이상 입력해주세요.</span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="birthdate" className="text-sm font-medium">
          생년월일 (선택)
        </label>
        <input
          id="birthdate"
          name="birthdate"
          type="date"
          className="field-input"
        />
        <span className="text-xs text-muted">
          비밀번호를 잊었을 때 본인확인용으로 쓰여요.
        </span>
      </div>
      {state.error && <p className="text-sm text-negative">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "가입 중..." : "회원가입"}
      </button>
    </form>
  );
}
