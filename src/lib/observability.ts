import * as Sentry from "@sentry/nextjs";
export function captureError(error:unknown,context:Record<string,unknown>={}){if(!process.env.SENTRY_DSN&&!process.env.NEXT_PUBLIC_SENTRY_DSN)return;Sentry.withScope(scope=>{scope.setExtras(context);Sentry.captureException(error);});}
