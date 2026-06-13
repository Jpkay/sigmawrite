"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    try {
      await createClient().auth.signOut();
    } catch {
      // Supabase not configured in local skeleton — fall through to redirect.
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start">
      <LogOut /> Se déconnecter
    </Button>
  );
}
