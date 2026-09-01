"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export function TurnstileChallenge({ action, onToken, resetSignal = 0 }: {
  action: string;
  onToken: (token: string | null) => void;
  resetSignal?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!turnstileSiteKey || !ready || !containerRef.current || !window.turnstile) return;
    if (widgetRef.current) window.turnstile.remove(widgetRef.current);
    onToken(null);
    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: turnstileSiteKey,
      action,
      theme: "auto",
      size: "flexible",
      callback: (token: string) => onToken(token),
      "expired-callback": () => onToken(null),
      "timeout-callback": () => onToken(null),
      "error-callback": () => { onToken(null); return true; },
    });
    return () => {
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [action, onToken, ready, resetSignal]);

  if (!turnstileSiteKey) return null;
  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setReady(true)} />
    <div ref={containerRef} aria-label="Vérification anti-robot" className="min-h-[65px] w-full" />
  </>;
}
