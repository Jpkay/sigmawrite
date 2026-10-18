/** Consistent page header used across dashboards. */
export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-border-strong pb-6">
      <div className="max-w-3xl">
        {eyebrow && <p className="app-eyebrow mb-4">{eyebrow}</p>}
        <h1 className="text-balance font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.06] tracking-[-0.055em]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[15px] leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
