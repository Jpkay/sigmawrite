# Plume production app proxy

`app.trouvetaplume.com` is the stable, branded application origin. The apex
domain remains the public marketing site, while this Worker forwards secure app
traffic to the public Vercel production alias (`sigmawrite.vercel.app`).

Deploy from the repository root:

```bash
npx wrangler deploy --config workers/app-proxy/wrangler.jsonc
```

The proxy deliberately does not cache responses. Authentication cookies remain
host-only on `app.trouvetaplume.com`, and redirects produced by the Vercel alias
are rewritten back to the branded app origin.
