"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Exports the current report via the browser's print-to-PDF (PRD §N export). */
export function PrintButton({ label = "Exporter / imprimer" }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer /> {label}
    </Button>
  );
}
