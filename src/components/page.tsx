/** Consistent page header used across dashboards. */
export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-muted-foreground">{description}</p>}
    </div>
  );
}

/** Placeholder block for routes whose feature lands in a later phase. */
export function ComingSoon({ phase, note }: { phase: string; note: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="text-sm font-medium text-primary">{phase}</p>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
