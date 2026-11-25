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
