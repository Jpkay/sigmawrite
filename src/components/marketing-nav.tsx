import Link from "next/link";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/about", label: "À propos" },
  { href: "/schools", label: "Écoles" },
  { href: "/parents", label: "Parents" },
  { href: "/privacy", label: "Confidentialité" },
];

export function MarketingNav() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground hover:text-foreground">
          <BookOpen className="size-5 text-primary" />
          Reading to Learn
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <details className="relative md:hidden">
          <summary className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm">Menu</summary>
          <nav aria-label="Navigation mobile" className="absolute right-0 top-12 z-50 grid min-w-48 gap-1 rounded-md border border-border bg-background p-2 shadow-lg">
            {links.map((link)=><Link key={link.href} href={link.href} className="rounded px-3 py-2 text-sm hover:bg-accent">{link.label}</Link>)}
          </nav>
        </details>
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Se connecter
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>
            Commencer
          </Link>
        </div>
      </div>
    </header>
  );
}
