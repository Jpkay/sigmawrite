import Link from "next/link";
import { Check, Feather } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,.92fr)]">
      <section className="relative hidden overflow-hidden border-r border-border bg-muted/50 p-12 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="relative z-10 flex items-center gap-3 font-display text-xl font-bold text-foreground hover:text-foreground">
          <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"><Feather className="size-5" /></span>
          <span>Plume<span className="text-primary">.</span></span>
        </Link>
        <div className="relative z-10 max-w-xl py-16">
          <p className="mb-5 font-display text-xs font-semibold uppercase tracking-[0.18em] text-primary">Lire · comprendre · progresser</p>
          <h2 className="font-display text-5xl font-semibold leading-[1.02] tracking-[-0.05em]">Chaque lecture ouvre une nouvelle piste.</h2>
          <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">Un espace calme et personnel pour développer sa lecture, sa mémoire et sa confiance.</p>
          <div className="mt-10 space-y-3 text-sm font-medium">{["Des textes au bon niveau", "Des progrès visibles", "Un parcours qui respecte ton rythme"].map(item => <p key={item} className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-success/15 text-success"><Check className="size-3.5" /></span>{item}</p>)}</div>
        </div>
        <div className="absolute -bottom-24 -right-16 size-[28rem] rounded-full border-[5rem] border-secondary/25" />
        <div className="absolute right-16 top-28 size-28 rotate-12 rounded-xl bg-primary/90 shadow-[0_18px_50px_rgba(255,63,142,.18)]" />
        <div className="absolute right-36 top-52 size-20 -rotate-6 rounded-full bg-success/80" />
      </section>
      <section className="relative flex min-h-screen items-center justify-center px-6 py-14 sm:px-12">
        <div className="absolute right-5 top-5"><ThemeToggle /></div>
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-2 font-display text-lg font-bold text-foreground hover:text-foreground lg:hidden"><Feather className="size-5 text-primary" /><span>Plume<span className="text-primary">.</span></span></Link>
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.16em] text-primary">Bienvenue</p>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.04em]">{title}</h1>
        {description && (
          <p className="mt-2 text-base text-muted-foreground">{description}</p>
        )}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </section>
    </main>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        {...props}
        className="h-12 w-full rounded-md border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-faint focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}
