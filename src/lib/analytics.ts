"use client";
import posthog from "posthog-js";

let initialized=false;
function client(){const key=process.env.NEXT_PUBLIC_POSTHOG_KEY;if(!key||typeof window==="undefined")return null;if(!initialized){posthog.init(key,{api_host:process.env.NEXT_PUBLIC_POSTHOG_HOST??"https://eu.i.posthog.com",person_profiles:"identified_only",capture_pageview:true,capture_pageleave:true});initialized=true;}return posthog;}
export function identifyAnalytics(id:string,role:string){client()?.identify(id,{role});}
export function track(event:string,properties:Record<string,unknown>={}){client()?.capture(event,properties);}
export function isFeatureEnabled(flag:string,fallback=true){const instance=client();return instance?instance.isFeatureEnabled(flag)??fallback:fallback;}
