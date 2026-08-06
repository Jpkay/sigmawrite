"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ label = "Se déconnecter" }: { label?: string }) {
  const router = useRouter();

  async function signOut() {
    try {
      await createClient().auth.signOut();
    } catch {
      // Supabase not configured in local skeleton — fall through to redirect.
    }
    if ("serviceWorker" in navigator) navigator.serviceWorker.controller?.postMessage({ type: "CLEAR_PRIVATE_STATE" });
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("sigmawrite-")).map((key) => caches.delete(key)));
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start">
      <LogOut /> {label}
    </Button>
  );
}
