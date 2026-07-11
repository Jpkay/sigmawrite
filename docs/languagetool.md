# LanguageTool

The writing layer uses a self-hosted LanguageTool HTTP service. Start it with
`docker compose -f docker-compose.languagetool.yml up -d` and set
`LANGUAGETOOL_URL=http://localhost:8010` locally or to the private service URL
in staging/production.

The application uses a ten-second timeout. If the service is unavailable, the
summary still completes with the blended rubric, the evaluation is stored with
`degraded=true`, and no grammar issue is invented. Operations should alert on
repeated degraded evaluations and restore the service before reprocessing.
