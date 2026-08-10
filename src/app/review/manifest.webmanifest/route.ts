export function GET() {
  return Response.json(
    {
      id: "/review",
      name: "SigmaWrite — Évaluation",
      short_name: "SigmaWrite",
      description: "Espace d’évaluation des contenus SigmaWrite",
      start_url: "/review",
      scope: "/review",
      display: "standalone",
      background_color: "#F7F2E6",
      theme_color: "#FF3F8E",
      lang: "fr",
      icons: [
        {
          src: "/app-icon.svg",
          sizes: "any",
          type: "image/svg+xml",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "application/manifest+json",
      },
    },
  );
}
