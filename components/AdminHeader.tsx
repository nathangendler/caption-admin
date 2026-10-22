import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/users", label: "Users" },
  { href: "/moments", label: "Moments" },
  { href: "/votes", label: "Votes" },
];

export async function AdminHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-hairline bg-cream">
      <nav className="mx-auto flex max-w-5xl items-center gap-5 px-4 py-3 text-[13px] sm:px-8">
        <span className="eyebrow">Caption admin</span>
        {user?.isSuperadmin &&
          NAV.map((item) => (
            <Link key={item.href} href={item.href} className="font-semibold text-subtle hover:text-ink">
              {item.label}
            </Link>
          ))}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="flex items-center gap-2 font-semibold text-ink">
                <Avatar url={user.avatarUrl} name={user.firstName ?? user.email ?? "?"} size={24} />
                <span className="hidden sm:inline">{user.email}</span>
              </span>
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-subtle hover:text-ink">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn-outline btn-sm">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
