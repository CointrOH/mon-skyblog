import { defineConfig } from 'astro/config';

// URL publique du site, utilisée par Astro (`site`).
// - En CI : fournie par le workflow GitHub Pages (`SITE_URL`).
// - En local : placeholder à remplacer par l'URL réelle du site.
const site = process.env.SITE_URL || 'https://example.github.io';

// Chemin de base quand le site est servi dans un sous-dossier
// (page de projet GitHub Pages : `/mon-repo`). Normalisation : commence par
// `/`, pas de slash final (sauf racine `/`), une valeur vide ou absente vaut `/`.
function normalizeBase(rawBase) {
  const value = (rawBase ?? '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  return value ? `/${value}` : '/';
}

const base = normalizeBase(process.env.BASE_PATH);

// Astro 7 cherche par défaut la configuration de contenu dans
// `src/content.config.ts`. Le projet conservant l'emplacement historique
// `src/content/config.ts`, on active le flag legacy officiel.
export default defineConfig({
  site,
  base,
  legacy: {
    collectionsBackwardsCompat: true,
  },
});
