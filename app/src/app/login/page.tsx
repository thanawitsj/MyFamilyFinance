import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">กำลังโหลด...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
