"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { BookOpen } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { identifyAnalytics } from "@/lib/analytics";

export type NavItem = { href: string; label: string };

/**
 * Shared chrome for every role dashboard: branded sidebar with nav + a
 * scrollable content column. Active link is derived from the live pathname.
 */
export function DashboardShell({
  area,
  nav,
  user,
  signOutLabel,
  language = "fr",
  children,
}: {
  area: string;
  nav: NavItem[];
  user?: { name: string; role: string; analyticsId?: string };
  signOutLabel?: string;
  language?: "fr" | "en";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const home = nav[0]?.href;
  useEffect(() => { if (user?.analyticsId) identifyAnalytics(user.analyticsId, user.role); }, [user?.analyticsId, user?.role]);

  return (
    <div lang={language} className="flex min-h-screen w-full bg-background">
      <a href="#main-content" className="sr-only z-[100] rounded bg-background p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{language === "en" ? "Skip to content" : "Aller au contenu"}</a>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/80 md:flex">
        <div className="flex h-18 items-center gap-2.5 border-b border-border px-5">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><BookOpen className="size-4" /></span>
          <span className="font-display text-lg font-bold tracking-tight">SigmaWrite<span className="text-primary">.</span></span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
        <div className="px-5 pb-3 pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {area}
        </div>
        <nav aria-label={area} className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== home && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative block rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-accent text-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                    : "text-muted-foreground hover:translate-x-0.5 hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border bg-muted/30 p-3">
          {user && (
            <div className="mb-2 px-3 py-1 text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs capitalize text-muted-foreground">
                {user.role.replace("_", " ")}
              </div>
            </div>
          )}
          <SignOutButton label={signOutLabel} />
        </div>
      </aside>

      <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden">
        <div className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Link href={home ?? "/"} className="flex items-center gap-2 font-display font-bold text-foreground hover:text-foreground"><BookOpen className="size-5 text-primary" />SigmaWrite<span className="text-primary">.</span></Link>
            <div className="flex items-center gap-2"><ThemeToggle /><SignOutButton label={signOutLabel} /></div>
          </div>
          <nav aria-label={area} className="flex max-w-[calc(100vw-2rem)] gap-1 overflow-x-auto pb-1">
            {nav.map((item) => { const active=pathname === item.href || (item.href !== home && pathname.startsWith(item.href + "/")); return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} className={cn("shrink-0 rounded-md px-3 py-2 text-sm",active ? "bg-primary/15 text-primary" : "text-muted-foreground")}>{item.label}</Link>;})}
          </nav>
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-8 sm:py-10 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
