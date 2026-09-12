// Imported by the module worker and the authenticated student layout.
// Keep this module free of browser globals so server rendering uses the same text.
export const OFFLINE_FALLBACK_COPY = {
 title: 'Hors ligne',
 heading: 'Connexion indisponible',
 message: 'Reconnecte-toi pour accéder en toute sécurité à tes données.',
};
export const OFFLINE_FALLBACK_HTML = `<!doctype html><html lang=fr><meta charset=utf-8><meta name=viewport content='width=device-width'><title>${OFFLINE_FALLBACK_COPY.title}</title><main><h1>${OFFLINE_FALLBACK_COPY.heading}</h1><p>${OFFLINE_FALLBACK_COPY.message}</p></main>`;
