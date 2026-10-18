import { cn } from "@/lib/utils";
import { DASHBOARD_COPY } from "@/lib/student-interface-copy";

/** Shared with the marketing identity; UI and reading text stay sans serif. */
export function PlumeWordmark({ className }: { className?: string }) {
  return <span className={cn("plume-wordmark text-[2rem]", className)}>{DASHBOARD_COPY.brand}<span className="plume-wordmark-dot">.</span></span>;
}
