import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { NavPills } from "./nav-pills";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex flex-1 flex-col bg-canvas-light">
      {/* Primary nav — soft icy-blue strip with dark teal text */}
      <header className="sticky top-0 z-20 bg-surface-header text-ink border-b border-hairline-light">
        <div className="mx-auto flex h-12 max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="text-[16px] font-semibold tracking-[0.3px] text-ink-deep"
          >
            MyFamilyFinance
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="min-h-11 px-2 text-[13px] font-medium text-body-light hover:text-ink"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>

        {/* Sub-nav — pastel pills with active-page highlight */}
        <NavPills />
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-5 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
