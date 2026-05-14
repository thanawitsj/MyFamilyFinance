import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Dedupes `auth.getUser()` across server components within the same request.
 * Without React cache(), every server component in the tree (layout + page)
 * would hit Supabase Auth API separately — adding ~150-300ms per call.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
