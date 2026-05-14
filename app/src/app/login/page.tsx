import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center bg-canvas-light px-4 py-12 sm:px-6">
      <Suspense fallback={<div className="caption-md text-mute-light">กำลังโหลด...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
