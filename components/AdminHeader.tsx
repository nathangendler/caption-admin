"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Overview" },
  { href: "/users", label: "Users" },
  { href: "/moments", label: "Moments" },
  { href: "/votes", label: "Votes" },
];

export function AdminNav({ email, isSuperadmin }: { email: string | null; isSuperadmin: boolean }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-black px-6 py-3">
      <h1 className="font-semibold">Caption Admin</h1>
      {isSuperadmin && (
        <nav className="flex gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded px-3 py-1 text-sm ${
                active(tab.href)
                  ? "bg-black text-white"
                  : "border border-black bg-white text-black hover:opacity-70"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
      {email && (
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span>{email}</span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="rounded bg-black px-2 py-1 text-white hover:opacity-70">
              Log out
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
