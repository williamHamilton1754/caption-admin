import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google → Supabase → here. Swap the one-time code for a session cookie.
// The dashboard then decides whether this account is a superadmin.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    const reason = searchParams.get("error_description") ?? "Missing sign-in code.";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(reason)}`, origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, origin));
  }

  return NextResponse.redirect(new URL("/", origin));
}
