# Mon Skyblog

Journal rétro statique construit avec [Astro](https://astro.build) : une page d'accueil qui liste
les articles, une page de lecture par article rendue depuis une collection de contenu Markdown,
et une page 404 accessible. Le thème rétro complet viendra dans un second temps.

## Prérequis

- Node.js 22 ou plus récent (projet développé avec Node 24.22.2)
- npm 10 ou plus récent (projet développé avec npm 11.19.1)

## Commandes

| Commande            | Effet                                                   |
| ------------------- | ------------------------------------------------------- |
| `npm install`       | Installe les dépendances                                |
| `npm run dev`       | Serveur de développement sur http://localhost:4321      |
| `npm run build`     | Build statique dans `dist/`                             |
| `npm run preview`   | Prévisualise le build localement                        |
| `npm start`         | Alias de `npm run dev`                                  |

> Si le cache npm global est en lecture seule, utilisez un cache local :
> `npm --cache .npm-cache install` (le dossier `.npm-cache/` est ignoré par Git).

Les scripts désactivent la télémétrie d'Astro (`ASTRO_TELEMETRY_DISABLED=1`) pour garder des
builds déterministes et éviter toute écriture de fichier hors du projet.

## Structure

```
src/
├── content/
│   ├── config.ts              # Schéma Zod de la collection « blog » (emplacement legacy)
│   └── blog/                  # Articles Markdown
├── layouts/
│   └── BaseLayout.astro       # Gabarit HTML5 commun (header, main, footer, skip-link)
├── pages/
│   ├── index.astro            # Liste des articles, du plus récent au plus ancien
│   ├── 404.astro              # Page introuvable
│   └── blog/[slug].astro      # Page d'un article
└── utils/
    └── slug.ts                # Conversion identifiant de contenu → slug d'URL
```

## Configuration de contenu

La collection `blog` est déclarée dans `src/content/config.ts`, l'emplacement historique d'Astro.
Astro 7 attend normalement `src/content.config.ts` ; le flag officiel
`legacy.collectionsBackwardsCompat: true` dans `astro.config.mjs` rétablit l'ancien emplacement
ainsi que l'API legacy (`defineCollection` sans `loader`, `z` importé depuis `astro/zod`).

Champs obligatoires du frontmatter : `title` (≥ 3 caractères), `date`, `description` (≥ 10
caractères). Champs optionnels : `author` (défaut « Le Webmaster »), `tags` (défaut `[]`),
`cover`, `draft` (défaut `false`). Un frontmatter non conforme fait échouer le build.

## Ajouter un article

Créer un fichier `src/content/blog/mon-article.md` avec un frontmatter conforme, puis lancer
`npm run build`. Le slug d'URL est dérivé du chemin du fichier ; les articles marqués
`draft: true` sont exclus des pages générées en production (mais visibles en développement).
