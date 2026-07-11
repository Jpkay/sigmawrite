"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
export default function GlobalError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){useEffect(()=>{Sentry.captureException(error);},[error]);return <html lang="fr"><body><main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-semibold">Une erreur est survenue</h1><p className="mt-2 text-muted-foreground">L’équipe a reçu le signal. Tu peux réessayer.</p><button className="mt-5 rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={reset}>Réessayer</button></main></body></html>}
