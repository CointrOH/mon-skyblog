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
| `npm run cms`       | Proxy d'écriture locale Decap (`decap-server`, port 8081) |
| `npm start`         | Alias de `npm run dev`                                  |

> Si le cache npm global est en lecture seule, utilisez un cache local :
> `npm --cache .npm-cache install` (le dossier `.npm-cache/` est ignoré par Git).

Les scripts désactivent la télémétrie d'Astro (`ASTRO_TELEMETRY_DISABLED=1`) pour garder des
builds déterministes et éviter toute écriture de fichier hors du projet.

## Structure

```
public/
├── admin/
│   └── config.yml             # Configuration Decap CMS (backend, collection blog)
└── images/
    └── uploads/               # Médias déposés via le CMS (public_folder /images/uploads)
src/
├── content/
│   ├── config.ts              # Schéma Zod de la collection « blog » (emplacement legacy)
│   └── blog/                  # Articles Markdown
├── layouts/
│   └── BaseLayout.astro       # Gabarit HTML5 commun (header, main, footer, skip-link)
├── pages/
│   ├── index.astro            # Liste des articles, du plus récent au plus ancien
│   ├── 404.astro              # Page introuvable
│   ├── admin/index.astro      # Interface d'administration Decap CMS (/admin/)
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

## Administration (Decap CMS)

L'interface d'administration est servie sur `/admin/`. Decap CMS est **auto-hébergé** : le paquet
npm `decap-cms-app` (version épinglée `3.18.0`, React 19 en peer dependency) est bundlé par Vite
au build ; aucun script ni asset n'est chargé depuis un CDN au runtime. La configuration se
trouve dans `public/admin/config.yml`.

### Utilisation en local (aucune OAuth)

Deux terminaux sont nécessaires :

1. `npm run dev` — sert le site (et `/admin/`) sur http://localhost:4321 ;
2. `npm run cms` — démarre `decap-server` sur le port 8081 (proxy d'écriture locale).

Ouvrir ensuite http://localhost:4321/admin/ : Decap détecte `decap-server` et utilise le backend
« proxy » local, ce qui permet de se connecter en un clic (aucun identifiant ni OAuth). Les
articles créés/édités sont écrits **directement** dans `src/content/blog/*.md`. Les images sont
déposées dans `public/images/uploads/`.

Le script `npm run cms` ne sert qu'au développement : en production, il n'y a pas de proxy local
et l'écriture passe par le backend Git.

### Backend de production (placeholders à compléter en T5)

`public/admin/config.yml` contient des **placeholders explicitement commentés** :

- `backend.repo: owner/repo` — à remplacer par le dépôt GitHub réel ;
- `backend.base_url` (commenté) — URL du proxy OAuth, à renseigner en production.

Tant que ces valeurs ne sont pas remplacées, le mode local fonctionne mais le backend GitHub de
production ne peut pas authentifier l'utilisateur : **la mise en production nécessite un flux
OAuth** (documenté séparément, tâche T5).

### Recette de validation manuelle (navigateur)

Aucun navigateur n'est disponible dans l'environnement de développement automatisé (Chromium
sans bibliothèques système) : les points suivants doivent être vérifiés à la main.

1. **Connexion locale** : lancer `npm run dev` + `npm run cms`, ouvrir
   http://localhost:4321/admin/ ; l'UI Decap s'affiche (pas d'erreur de config). Cliquer sur le
   bouton de connexion : la connexion est immédiate, sans identifiant ni OAuth. (Si le proxy
   local n'est pas détecté, le CMS bascule sur le backend GitHub et affiche une demande d'OAuth.)
2. **Création d'un article** : collection « Articles » → « Nouvel article », renseigner titre,
   date, description, tags, brouillon, saisir le contenu Markdown, puis enregistrer.
3. **Vérification du fichier écrit** : constater l'apparition/mise à jour de
   `src/content/blog/<slug>.md` (frontmatter + corps Markdown), puis `npm run build` et vérifier
   que l'article apparaît sur `/` et `/blog/<slug>/` (un frontmatter non conforme au schéma fait
   échouer le build).

### Champs de la collection

Les champs Decap (`title`, `date`, `description`, `author`, `tags`, `cover`, `draft`, `body`)
correspondent exactement au schéma `.strict()` de `src/content/config.ts` ; `body` est le corps
Markdown de l'entrée et n'est pas écrit dans le frontmatter. Tout ajout de champ côté CMS doit
être répercuté dans le schéma Astro, sinon le build échoue.

