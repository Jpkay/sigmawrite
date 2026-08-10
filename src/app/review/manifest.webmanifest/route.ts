export function GET() {
  return Response.json(
    {
      id: "/review",
      name: "Plume — Évaluation",
      short_name: "Plume",
      description: "Espace d’évaluation des contenus Plume",
      start_url: "/review",
      scope: "/review",
      display: "standalone",
      background_color: "#F7F2E6",
      theme_color: "#A80049",
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
