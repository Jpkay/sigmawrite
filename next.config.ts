import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // The public app proxy forwards to sigmawrite.vercel.app. Trust only
      // the public app origin while retaining Next.js's CSRF origin checks.
      allowedOrigins: ["app.trouvetaplume.com"],
    },
  },
};

export default withSentryConfig(nextConfig,{silent:true,org:process.env.SENTRY_ORG,project:process.env.SENTRY_PROJECT,authToken:process.env.SENTRY_AUTH_TOKEN,sourcemaps:{deleteSourcemapsAfterUpload:true},webpack:{treeshake:{removeDebugLogging:true}}});
