import Link from "next/link";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

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
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BookOpen className="size-5 text-primary" />
          Reading to Learn
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
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
