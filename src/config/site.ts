// Configuration publique du site.
// Ne contient AUCUN secret : les identifiants Giscus et le code GoatCounter
// sont publics par nature (ils apparaissent côté navigateur).

// Giscus (commentaires via GitHub Discussions).
// Les identifiants du dépôt et de la catégorie sont visibles dans l'iframe :
// ils ne donnent aucun droit d'écriture. L'application giscus doit être
// installée sur le dépôt par le propriétaire (voir README).
export const giscus = {
  repo: 'CointrOH/mon-skyblog',
  repoId: 'R_kgDOV7a4xQ',
  category: 'Announcements',
  categoryId: 'DIC_kwDOV7a4xc4DL8UZ',
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'bottom',
  theme: 'light',
  lang: 'fr',
  loading: 'lazy',
} as const;

// Code du site GoatCounter (public). Vide tant que le site n'existe pas ou que
// la variable `GOATCOUNTER_CODE` n'est pas définie : le compteur affiche alors
// un état « activation en cours » sans script externe.
export const goatcounterCode = import.meta.env.PUBLIC_GOATCOUNTER_CODE ?? '';

// Adresse de contact RGPD. Vide provisoirement : la page Confidentialité
// renvoie alors vers les Discussions GitHub (voir README, actions ouvertes).
export const contactEmail = '';
