import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Who is signed in, and does their profile have is_superadmin = true?
export async function getAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, isAdmin: false };
  }

  const { data } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle<{ is_superadmin: boolean }>();

  return { supabase, user, isAdmin: data?.is_superadmin === true };
}

// Every admin page calls this first. Signed-out → /login, not an admin → /denied.
// The database enforces the same rule (RLS), so this is the second lock, not the only one.
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.user) {
    redirect("/login");
  }
  if (!session.isAdmin) {
    redirect("/denied");
  }
  return { ...session, user: session.user };
}
