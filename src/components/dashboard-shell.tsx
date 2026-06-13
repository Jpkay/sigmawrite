"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

/**
 * Shared chrome for every role dashboard: branded sidebar with nav + a
 * scrollable content column. Active link is derived from the live pathname.
 */
export function DashboardShell({
  area,
  nav,
  user,
  children,
}: {
  area: string;
  nav: NavItem[];
  user?: { name: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const home = nav[0]?.href;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <BookOpen className="size-5 text-primary" />
          <span className="font-semibold">Reading to Learn</span>
        </div>
        <div className="px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground">
          {area}
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== home && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          {user && (
            <div className="mb-2 px-3 py-1 text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs capitalize text-muted-foreground">
                {user.role.replace("_", " ")}
              </div>
            </div>
          )}
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
