"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const initialState: LoginState = {};
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form className="flex flex-col gap-6" action={action}>
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="identifier"
          className="text-xs font-bold text-[#b9cacb] uppercase tracking-[0.2em] px-1"
        >
          Email or Employee ID
        </Label>
        <div className="relative group">
          <Input
            id="identifier"
            name="identifier"
            className="w-full bg-[#0c0e16]/50 border-0 border-b-2 border-[#3a494b] focus-visible:border-[#00dbe7] focus-visible:ring-0 text-[#e1fdff] placeholder:text-[#46464c] py-6 px-1 transition-all duration-300 rounded-none h-auto"
            placeholder="EMP-XXXXX or name@company.com"
            autoComplete="username"
            required
            type="text"
          />
          <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#e1fdff] group-focus-within:w-full transition-all duration-500 shadow-[0_0_8px_#00dbe7]" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-xs font-bold text-[#b9cacb] uppercase tracking-[0.2em] px-1"
        >
          Password
        </Label>
        <div className="relative group">
          <Input
            id="password"
            name="password"
            className="w-full bg-[#0c0e16]/50 border-0 border-b-2 border-[#3a494b] focus-visible:border-[#00dbe7] focus-visible:ring-0 text-[#e1fdff] placeholder:text-[#46464c] py-6 px-1 transition-all duration-300 rounded-none h-auto"
            placeholder="password123"
            autoComplete="current-password"
            required
            type="password"
          />
          <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#e1fdff] group-focus-within:w-full transition-all duration-500 shadow-[0_0_8px_#00dbe7]" />
        </div>
      </div>

      {state.message ? (
        <p className="border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-between items-center px-1">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            className="w-5 h-5 rounded-none border-[#849495] data-[state=checked]:bg-[#ecb2ff] data-[state=checked]:border-[#ecb2ff]"
          />
          <Label
            htmlFor="remember"
            className="text-xs text-[#b9cacb] cursor-pointer font-normal"
          >
            Remember me
          </Label>
        </div>
        {/*<Link
          className="text-xs text-[#e1fdff] hover:drop-shadow-[0_0_5px_#00dbe7] transition-all"
          href="/dashboard/reset-password"
        >
          Forgot Password?
        </Link>*/}
      </div>

      <Button
        className="mt-4 bg-gradient-to-r from-[#00dbe7] to-[#00f2ff] text-[#00363a] font-bold py-7 rounded-none uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,219,231,0.4)] cursor-pointer border-none"
        disabled={pending}
      >
        {pending ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}
