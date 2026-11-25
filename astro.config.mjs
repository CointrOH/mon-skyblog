import { defineConfig } from 'astro/config';

// Astro 7 cherche par défaut la configuration de contenu dans
// `src/content.config.ts`. Le projet conservant l'emplacement historique
// `src/content/config.ts`, on active le flag legacy officiel.
export default defineConfig({
  legacy: {
    collectionsBackwardsCompat: true,
  },
});
