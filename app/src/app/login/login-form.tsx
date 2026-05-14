"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) setError(error.message);
  }

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    startTransition(async () => {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) {
          setError(error.message);
        } else {
          setInfo("ส่ง email ยืนยันให้แล้ว — โปรดเช็คกล่องจดหมาย (หรือถ้าปิด confirm email ก็ login ได้เลย)");
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.replace(redirect);
        router.refresh();
      }
    });
  }

  return (
    <Card className="w-full max-w-md p-7">
      <header className="mb-7">
        <p className="caption-md text-mute-light">MyFamilyFinance</p>
        <h1 className="display-md text-ink mt-1.5">
          {mode === "signin" ? "เข้าสู่ระบบ" : "สมัครบัญชีใหม่"}
        </h1>
      </header>

      <Button
        type="button"
        variant="secondary-light"
        size="lg"
        onClick={handleGoogle}
        disabled={pending}
        className="w-full"
      >
        เข้าสู่ระบบด้วย Google
      </Button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-hairline-light" />
        <span className="caption-sm text-mute-light uppercase tracking-[1px]">หรือ</span>
        <span className="h-px flex-1 bg-hairline-light" />
      </div>

      <form onSubmit={handleEmailPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">อีเมล</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">รหัสผ่าน</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </div>

        {error && (
          <div className="rounded-md border-[1.5px] border-hairline-light bg-tint-coral text-tint-coral-fg px-3 py-2 text-[14px]">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-md border-[1.5px] border-hairline-light bg-tint-mint text-tint-mint-fg px-3 py-2 text-[14px]">
            {info}
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
          {pending
            ? "กำลังดำเนินการ..."
            : mode === "signin"
              ? "เข้าสู่ระบบ"
              : "สมัคร"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setInfo(null);
        }}
        className="mt-5 w-full text-center text-[14px] text-link-light hover:underline underline-offset-4"
      >
        {mode === "signin"
          ? "ยังไม่มีบัญชี? สมัครที่นี่"
          : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"}
      </button>
    </Card>
  );
}
