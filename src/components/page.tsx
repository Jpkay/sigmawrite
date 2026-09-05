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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
      <div className="max-w-3xl">
        {eyebrow && <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
        <h1 className="text-balance font-display text-[clamp(1.75rem,4vw,2.35rem)] font-semibold leading-tight tracking-[-0.035em]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
