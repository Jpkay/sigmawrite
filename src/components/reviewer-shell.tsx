"use client";

import Link from "next/link";
import { CircleHelp, Feather, LayoutDashboard } from "lucide-react";
import { useEffect } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { identifyAnalytics } from "@/lib/analytics";

export function ReviewerShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; role: string; analyticsId?: string };
}) {
  useEffect(() => {
    if (user.analyticsId) identifyAnalytics(user.analyticsId, user.role);
  }, [user.analyticsId, user.role]);

  return <div lang="fr" className="min-h-screen bg-background">
    <a href="#review-content" className="sr-only z-[100] rounded bg-background p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Aller au texte</a>
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/review" className="flex items-center gap-2 font-display text-base font-bold text-foreground hover:text-foreground">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Feather className="size-4" /></span>
          <span>Plume<span className="text-primary">.</span></span>
        </Link>
        <span className="hidden text-sm text-muted-foreground sm:inline">Espace d’évaluation</span>
        <div className="ml-auto flex items-center gap-1">
          {user.role === "platform_admin" && <Link href="/admin" aria-label="Retour à l’administration" className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-primary hover:bg-primary/10 hover:text-primary"><LayoutDashboard className="size-4" /><span className="hidden sm:inline">Administration</span></Link>}
          <Link href="/review/instructions" className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><CircleHelp className="size-4" /><span className="hidden sm:inline">Consignes</span></Link>
          <ThemeToggle />
          <div className="hidden sm:block"><SignOutButton label="Quitter" /></div>
        </div>
      </div>
    </header>
    <main id="review-content" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-9">{children}</main>
  </div>;
}
