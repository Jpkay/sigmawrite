"use client";

import {DASHBOARD_COPY} from "@/lib/student-interface-copy";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, Brain, Home, Inbox, PenLine, TrendingUp, type LucideIcon } from "lucide-react";
import { PlumeWordmark } from "@/components/plume-wordmark";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { identifyAnalytics } from "@/lib/analytics";

export type NavItem = { href: string; label: string; matchPrefixes?: readonly string[] };
/** Bottom tab for phones; icon keys stay serializable across the server boundary. */
export type TabItem = { href: string; label: string; icon: "home" | "book" | "brain" | "progress" | "inbox" | "pen" };
/** Focus surfaces own the bottom of the screen (timers, submit bars); the tab bar steps aside there. */
const FOCUS_PREFIXES = ["/student/practice/", "/student/production/", "/student/read/", "/student/diagnostic", "/student/dictee/"];
const TAB_ICONS: Record<TabItem["icon"], LucideIcon> = { home: Home, book: BookOpen, brain: Brain, progress: TrendingUp, inbox: Inbox, pen: PenLine };

/**
 * Shared chrome for every role dashboard: branded sidebar with nav + a
 * scrollable content column. Active link is derived from the live pathname.
 */
export function DashboardShell({
  area,
  nav,
  user,
  signOutLabel,
  modeSwitch,
  language = "fr",
  tabs,
  children,
}: {
  area: string;
  nav: NavItem[];
  user?: { name: string; role: string; analyticsId?: string };
  signOutLabel?: string;
  modeSwitch?: React.ReactNode;
  language?: "fr" | "en";
  tabs?: TabItem[];
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const home = nav[0]?.href;
  const showTabs = !!tabs && !FOCUS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  useEffect(() => { if (user?.analyticsId) identifyAnalytics(user.analyticsId, user.role); }, [user?.analyticsId, user?.role]);

  return (
    <div lang={language} className="learning-app flex min-h-screen w-full bg-background">
      <a href="#main-content" className="sr-only z-[100] rounded bg-background p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{DASHBOARD_COPY[language].skip}</a>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col self-start overflow-y-auto border-r border-border bg-background md:flex">
        <div className="flex h-18 shrink-0 items-center gap-2.5 border-b border-border px-5">
          <Link href={home ?? "/"} className="inline-flex min-h-11 items-center text-foreground hover:text-foreground"><PlumeWordmark /></Link>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
        <div className="px-5 pb-3 pt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {area}
        </div>
        <nav aria-label={area} className="shrink-0 space-y-1 px-3 pb-5">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== home && pathname.startsWith(item.href + "/")) ||
              item.matchPrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative block rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "font-semibold text-foreground before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:bg-brand-hover"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto shrink-0 border-t border-border p-3 pt-4">
          {user && (
            <div className="mb-2 px-3 py-1 text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs capitalize text-muted-foreground">
                {user.role.replace("_", " ")}
              </div>
            </div>
          )}
          {modeSwitch && <div className="mb-2">{modeSwitch}</div>}
          <SignOutButton label={signOutLabel} />
        </div>
      </aside>

      <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden">
        <div className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Link href={home ?? "/"} className="flex min-h-11 items-center gap-2 font-display font-bold text-foreground hover:text-foreground"><PlumeWordmark className="text-[1.75rem]" /></Link>
            <div className="flex items-center gap-2"><ThemeToggle /><SignOutButton label={signOutLabel} /></div>
          </div>
          <nav aria-label={area} className="flex max-w-[calc(100vw-2rem)] gap-1 overflow-x-auto pb-1">
            {nav.map((item) => { const active=pathname === item.href || (item.href !== home && pathname.startsWith(item.href + "/")) || item.matchPrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/")); return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} className={cn("shrink-0 rounded-md px-3 py-2 text-sm",active ? "border-b-2 border-brand-hover font-semibold text-foreground" : "border-b-2 border-transparent text-muted-foreground")}>{item.label}</Link>;})}
          </nav>
          {modeSwitch && <div className="mt-2">{modeSwitch}</div>}
        </div>
        <div className={cn("mx-auto w-full max-w-7xl px-4 py-7 sm:px-8 sm:py-10 lg:px-10", showTabs && "pb-24 md:pb-10")}>{children}</div>
        {showTabs && tabs && (
          <nav aria-label={DASHBOARD_COPY[language].quickNavigation} className="fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-background/95 backdrop-blur-xl md:hidden" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`, paddingBottom: "env(safe-area-inset-bottom)" }}>
            {tabs.map((tab) => {
              const Icon = TAB_ICONS[tab.icon];
              const active = pathname === tab.href || (tab.href !== home && pathname.startsWith(tab.href + "/"));
              return (
                <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={cn("relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-foreground before:absolute before:inset-x-5 before:top-0 before:h-0.5 before:bg-brand-hover" : "text-muted-foreground")}>
                  <Icon className="size-5" aria-hidden />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}
      </main>
    </div>
  );
}
