import { PostHog } from "posthog-node";
let client:PostHog|null|undefined;
function serverClient(){if(client!==undefined)return client;const key=process.env.POSTHOG_KEY??process.env.NEXT_PUBLIC_POSTHOG_KEY;if(!key)return client=null;return client=new PostHog(key,{host:process.env.POSTHOG_HOST??process.env.NEXT_PUBLIC_POSTHOG_HOST??"https://eu.i.posthog.com",flushAt:1,flushInterval:0});}
export async function trackServer(distinctId:string,event:string,properties:Record<string,unknown>={}){const posthog=serverClient();if(!posthog)return;posthog.capture({distinctId,event,properties});await posthog.flush();}
