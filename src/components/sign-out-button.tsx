"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { clearOfflineQueue } from "@/lib/offline-queue";
import { resetStudentState } from "@/lib/student-store";

export function SignOutButton({ label = "Se déconnecter" }: { label?: string }) {
  const router = useRouter();

  async function signOut() {
    resetStudentState();
    try {
      await createClient().auth.signOut();
    } catch {
      // Supabase not configured in local skeleton — fall through to redirect.
    }
    clearOfflineQueue();
    localStorage.removeItem("rtl.student.v1");
    if ("serviceWorker" in navigator) navigator.serviceWorker.controller?.postMessage({ type: "CLEAR_PRIVATE_STATE" });
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("plume-") || key.startsWith("sigmawrite-")).map((key) => caches.delete(key)));
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
