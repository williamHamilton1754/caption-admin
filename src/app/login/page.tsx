import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { getAdminSession } from "@/lib/admin";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { user, isAdmin } = await getAdminSession();
  if (user) {
    redirect(isAdmin ? "/" : "/denied");
  }

  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 text-center dark:border-white/15 dark:bg-zinc-900">
        <p className="text-3xl">🛡️</p>
        <h1 className="mt-3 text-2xl font-semibold text-black dark:text-white">Caption the City Admin</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Superadmins only. Sign in with Google to continue.</p>
        {typeof error === "string" && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            Sign-in failed: {error}
          </p>
        )}
        <div className="mt-6">
          <GoogleSignInButton />
        </div>
      </div>
    </main>
  );
}
