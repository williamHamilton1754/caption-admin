import Link from "next/link";
import { signOut } from "@/app/actions";
import { getAdminSession } from "@/lib/admin";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/traffic", label: "Traffic" },
  { href: "/users", label: "Users" },
  { href: "/media", label: "AI media" },
  { href: "/votes", label: "Votes" },
];

export async function AdminHeader() {
  const { user, isAdmin } = await getAdminSession();

  return (
    <header className="border-b border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold text-black dark:text-white">
          🛡️ Caption Admin
        </Link>
        {isAdmin &&
          NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        {user && (
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-500 sm:inline dark:text-zinc-400">{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        )}
      </nav>
    </header>
  );
}
