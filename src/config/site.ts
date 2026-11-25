// Configuration publique du site.
// Ne contient AUCUN secret : le code GoatCounter est public par nature
// (il apparaît côté navigateur).

// Code du site GoatCounter (public). Vide tant que le site n'existe pas ou que
// la variable `GOATCOUNTER_CODE` n'est pas définie : le compteur affiche alors
// un état « activation en cours » sans script externe.
export const goatcounterCode = import.meta.env.PUBLIC_GOATCOUNTER_CODE ?? '';

// Adresse de contact RGPD. Vide provisoirement : la page Confidentialité
// indique qu'elle est en cours de création (aucun canal public de collecte).
export const contactEmail = '';

// Origine du Worker Cloudflare qui stocke et sert les commentaires (D1).
// Vide tant que le Worker n'est pas déployé : le composant Comments affiche
// alors un placeholder « activation en cours », sans formulaire ni requête.
// Doit être une origine HTTPS, sans slash final (ex. https://comments.exemple.workers.dev).
export const commentsApi = import.meta.env.PUBLIC_COMMENTS_API ?? '';

// Clé de site publique Turnstile (anti-spam, widget interaction-only).
// Vide tant qu'elle n'est pas configurée : même placeholder que ci-dessus.
// La clé secrète correspondante vit uniquement côté Worker Cloudflare.
export const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '';
