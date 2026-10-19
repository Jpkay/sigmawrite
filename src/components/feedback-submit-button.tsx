"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

// Disabled while the observation is being sent, so a slow network never
// leads to the same comment being submitted several times.
export function FeedbackSubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" variant="outline" className="mt-2" disabled={pending} aria-disabled={pending}>
    {pending ? "Envoi en cours…" : "Envoyer l’observation"}
  </Button>;
}
