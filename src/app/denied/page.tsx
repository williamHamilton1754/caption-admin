import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { getAdminSession } from "@/lib/admin";

export const metadata = { title: "Access denied" };

export default async function DeniedPage() {
  const { user, isAdmin } = await getAdminSession();
  if (!user) redirect("/login");
  if (isAdmin) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 text-center dark:border-white/15 dark:bg-zinc-900">
        <p className="text-3xl">🔒</p>
        <h1 className="mt-3 text-2xl font-semibold text-black dark:text-white">Access denied</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          You&apos;re signed in as <strong>{user.email}</strong>, but this account isn&apos;t a superadmin.
        </p>
        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            Sign out and try another account
          </button>
        </form>
      </div>
    </main>
  );
}
