# Mon Skyblog

Journal rétro « Skyblog 1990-2000 » construit avec **Astro** et éditable via **Decap CMS**.
Trois articles de démonstration, un thème accessible et volontairement daté (bannière, marquee,
compteur factice, livre d'or, webring), un rendu statique déployable sur GitHub Pages, et une
administration auto-hébergée en `/admin/` (aucun CDN).

## Fonctionnalités

- **Site statique** (Astro, sortie `static`) : accueil avec liste d'articles triée par date,
  pages d'article au Markdown enrichi, page 404 thématisée, favicon SVG local.
- **Collection de contenu `blog`** typée par un schéma Zod strict : article rendu depuis
  `src/content/blog/*.md`, brouillons exclus de la production.
- **CMS Decap** sur `/admin/` : interface en français, paquet npm auto-hébergé (aucun script
  distant), écriture directe des fichiers Markdown en local via `decap-server`.
- **Thème rétro accessible** : polices 100 % système, motifs CSS, cadres biseautés, bannière
  dégradée, marquee CSS **avec contrôle de pause** (WCAG 2.2.2), `prefers-reduced-motion`,
  contrastes AA vérifiés, skip-link, focus visible, `lang` correct sur les passages anglais.
- **Zéro JS sur les pages publiques** (seule la page admin charge un script module) et
  **zéro requête externe** (pas de police, image, CDN ni analytics ; seuls des liens sortants
  d'ancres sont présents).
- **Base-aware** : mêmes liens et assets à la racine (`/`) ou sous un sous-dossier (`/mon-repo`),
  pour GitHub Pages page utilisateur ou page de projet.
- **CI/CD GitHub Pages** : build et déploiement par GitHub Actions (`.github/workflows/deploy.yml`).

## Stack et versions

| Composant | Version (épinglée) | Rôle |
| --- | --- | --- |
| [Astro](https://astro.build) | **7.4.13** | Générateur de site statique |
| [Decap CMS](https://decapcms.org) (`decap-cms-app`) | **3.18.0** | Interface d'administration auto-hébergée |
| React / React DOM (peer de Decap) | **19.3.1** | Dépendances de l'interface admin |
| `@astrojs/markdown-remark` | **7.3.10** | Pipeline Markdown unified (réécriture base-aware des médias/liens) |
| `decap-server` (dev) | **3.11.6** | Proxy d'écriture locale pour le CMS |
| Node.js | **≥ 22.23.4** (développé avec 24.22.2) | Requis par Astro 7 ; `decap-server` exige ≥ 20 |
| npm | **≥ 9.6.5** (développé avec 11.19.1) | Gestionnaire de paquets |

Aucune autre dépendance que celles listées : pas de police distante, pas de bibliothèque tierce
ni de JS côté public.

## Démarrage rapide

```sh
# Installation à partir du lockfile
npm ci

# Développement du site (http://localhost:4321)
npm run dev

# CMS local : dans un second terminal
npm run cms        # decap-server sur http://localhost:8081

# Build statique dans dist/ puis prévisualisation
npm run build
npm run preview
```

> **Environnement au cache npm global en lecture seule** (CI, sandbox) : préfixez les commandes
> npm par un cache local, par exemple `npm --cache .npm-cache ci`, `npm --cache .npm-cache run
> build`. Le dossier `.npm-cache/` est ignoré par Git.

### Scripts npm

| Script | Effet |
| --- | --- |
| `npm ci` | Installation reproductible depuis `package-lock.json` |
| `npm run dev` | Serveur de développement Astro (port 4321) |
| `npm run cms` | Proxy d'écriture locale Decap (port 8081, localhost uniquement) |
| `npm run build` | Build statique dans `dist/` |
| `npm run preview` | Sert localement le build `dist/` |
| `npm start` | Alias de `npm run dev` |

Les scripts désactivent la télémétrie d'Astro (`ASTRO_TELEMETRY_DISABLED=1`) : builds
déterministes, aucune écriture hors du projet.

## Structure du projet

```
docs/
├── PLAN.md                    # Plan initial, historique des tâches/commits, revues, risques
└── decap-oauth.md             # Procédure OAuth de production (GitHub OAuth/App + worker)
.github/
└── workflows/
    └── deploy.yml             # CI : build Astro + publication GitHub Pages
public/
├── .nojekyll                  # Fichier vide conservé pour compatibilité (publication depuis une branche)
├── favicon.svg                # Favicon rétro local (SVG)
├── admin/
│   └── config.yml             # Configuration Decap CMS (backend, collection blog)
└── images/
    └── uploads/               # Médias déposés via le CMS (public_folder /images/uploads)
src/
├── components/                # Composants présentationnels (aucun script client)
│   ├── ArticleNav.astro       # Navigation précédent/suivant
│   ├── Badges.astro           # Badges rétro + « under construction » SVG
│   ├── Banner.astro           # Bannière dégradée (titre non h1)
│   ├── Footer.astro           # Pied de page
│   ├── Guestbook.astro        # Livre d'or de démonstration
│   ├── Marquee.astro          # Bandeau défilant CSS + contrôle de pause
│   ├── Nav.astro              # Navigation principale
│   ├── PostCard.astro         # Carte d'article (liste d'accueil)
│   ├── VisitCounter.astro     # Compteur de visites factice étiqueté
│   └── Webring.astro          # Webring (liens externes rel="noopener noreferrer")
├── content/
│   ├── config.ts              # Schéma Zod de la collection « blog » (emplacement legacy)
│   └── blog/                  # Articles Markdown (3 articles de démonstration)
├── layouts/
│   └── BaseLayout.astro       # Gabarit HTML5 commun (bannière, nav, marquee, footer)
├── pages/
│   ├── index.astro            # Accueil : liste + sidebar (grille 2 colonnes)
│   ├── 404.astro              # Page introuvable thématisée
│   ├── admin/index.astro      # Interface d'administration Decap CMS (/admin/)
│   └── blog/[slug].astro      # Page d'un article (fil d'Ariane, prose, commentaires démo)
├── styles/
│   └── skyblog.css            # Feuille globale unique du thème (sections commentées)
└── utils/
    ├── base.ts                # withBase() : préfixe les liens internes par le base path
    ├── rehype-base-images.mjs # Réécrit les chemins absolus du Markdown (images, liens)
    └── slug.ts                # Conversion identifiant de contenu → slug d'URL
```

## Gestion du contenu

La collection `blog` est déclarée dans **`src/content/config.ts`** avec l'API legacy d'Astro
(`defineCollection` sans `loader`, `z` importé depuis `astro/zod`) et un schéma **strict**.

| Champ | Type / contrainte | Défaut |
| --- | --- | --- |
| `title` | string, min. 3 caractères | requis |
| `date` | date coercée (`z.coerce.date()`) | requis |
| `description` | string, min. 10 caractères | requis |
| `author` | string | `Le Webmaster` |
| `tags` | tableau de strings | `[]` |
| `cover` | string optionnelle (chemin d'image) | — |
| `draft` | booléen | `false` |

Le Markdown de l'article est le **corps** de l'entrée (champ `body` côté CMS, jamais écrit dans le
frontmatter). Un frontmatter non conforme au schéma fait **échouer le build**.

### Ajouter un article à la main

1. Créer `src/content/blog/mon-article.md` avec un frontmatter conforme ;
2. Écrire le contenu en Markdown (pas de titre `h1` dans le corps : le `h1` vient de la page) ;
3. `npm run build` (ou `npm run dev`). L'article apparaît sur `/` et `/blog/mon-article/`.

Le **slug d'URL** est dérivé du chemin du fichier (`entryIdToSlug()`, `src/utils/slug.ts`) : les
articles en `draft: true` sont exclus des pages générées en production (mais visibles en
développement).

### Éditer via le CMS (local)

Deux terminaux : `npm run dev` et `npm run cms`, puis ouvrir
**http://localhost:4321/admin/**. Decap détecte `decap-server` et utilise le backend « proxy »
local : connexion immédiate sans identifiant ni OAuth, écriture **directe** dans
`src/content/blog/*.md`, images dans `public/images/uploads/`. Le CMS est configuré dans
`public/admin/config.yml` (interface `locale: fr`, collection unique `blog` alignée 1:1 sur le
schéma Astro). Aucun message, commentaire ou compteur affiché n'est réel : les éléments de
démonstration sont explicitement étiquetés.

> `decap-server` ne sert **qu'au développement** : il n'a aucune authentification et n'écoute que
> sur localhost. Ne jamais l'exposer en production.

## Thème et accessibilité

- **Feuille unique** `src/styles/skyblog.css` (~13 Ko), importée une seule fois dans
  `BaseLayout.astro` : sections commentées (base, layout, bannière, nav, marquee, articles,
  sidebar, prose, footer, responsive, `prefers-reduced-motion`).
- **Polices 100 % système** : `"Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive` (titres),
  `Georgia, "Times New Roman", serif` (corps), `"Courier New", monospace` (compteurs, méta).
  Aucun `@import`, aucun `@font-face`, aucun CDN.
- **Marquee CSS** avec **contrôle de pause visible et clavier** (case à cocher + label, CSS pur) :
  conforme WCAG 2.2.2 ; `prefers-reduced-motion` fige toutes les animations et masque le contrôle
  devenu inutile. L'étoile clignotante initialement prévue a été rendue statique.
- **Contrastes** AA vérifiés sur 27 paires texte/fond (≥ 4.5:1 pour le texte courant, la plupart
  ≥ 7:1) ; indicateur de focus noir + halo jaune ; skip-link ; `lang="en"` sur les badges et
  mentions anglaises.
- **Zéro JS public** : les pages publiques n'incluent aucun `<script>` ; seule
  `src/pages/admin/index.astro` charge le bundle module du CMS (généré localement).
- **Zéro requête externe** : aucune police, image distante, CDN, analytics ; les seuls liens
  sortants sont les ancres du webring (`target="_blank" rel="noopener noreferrer"`, signalées) et
  les liens Markdown explicitement qualifiés « lien externe ».

## Déploiement GitHub Pages

Le déploiement est automatisé par [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) :
push sur `main` (ou lancement manuel), build puis publication de l'artefact `dist/`.

**Prérequis (une seule fois)** :

1. Pousser le dépôt sur GitHub ;
2. **Settings → Pages → Source = GitHub Actions** ;
3. (Optionnel) **Settings → Secrets and variables → Actions → Variables** :
   - `SITE_URL` — URL publique du site (utile pour un domaine personnalisé) ;
   - `BASE_PATH` — chemin de base si vous voulez forcer une valeur.

**URL et `base` automatiques** (sans variable) :

- **page utilisateur** (dépôt `<owner>.github.io`) → `BASE_PATH=/` ;
- **page de projet** (dépôt `mon-repo`) → `BASE_PATH=/mon-repo` ;
- `SITE_URL` par défaut : `https://<owner>.github.io`.

Le workflow calcule ces valeurs (sorties d'étape garanties) et les transmet à Astro ; le même
build fonctionne à la racine ou sous un sous-dossier. Le fichier `public/.nojekyll` (vide) est
copié dans `dist/` : il est **conservé pour compatibilité** au cas où le site serait un jour
publié depuis une branche (Jekyll y ignore les dossiers commençant par `_`), mais il est **inutile
au flux GitHub Actions actuel**, qui publie directement l'artefact Pages sans passer par Jekyll.
Pour reproduire un build de page de projet en local :

```sh
SITE_URL=https://<owner>.github.io BASE_PATH=/mon-repo npm run build
```

Un domaine personnalisé se configure via la variable `SITE_URL` et **Settings → Pages → Custom
domain** (laisser `BASE_PATH` vide ou `/`).

## OAuth pour la production (Decap CMS)

Le backend GitHub de Decap ne peut pas s'authentifier depuis un site statique : il faut un petit
**service OAuth externe** (worker Cloudflare type `sveltia-cms-auth`, ou service hébergé Decap
Turbo). Procédure complète, sécurité et tests : **[`docs/decap-oauth.md`](docs/decap-oauth.md)**.

Trois valeurs sont à fournir (documentées dans la procédure) :

- `backend.repo` — le dépôt GitHub réel (`<owner>/<repo>`) ;
- `backend.base_url` — l'**origine** du service OAuth (ex.
  `https://sveltia-cms-auth.<compte>.workers.dev`, sans chemin ni slash final) ;
- `backend.auth_scope` (optionnel) — `public_repo` si le dépôt est public (OAuth App uniquement,
  sans effet avec une GitHub App).

> **Rien n'est configuré ni déployé dans ce dépôt** : `repo` et `base_url` sont des placeholders.
> Aucun secret, client ID, ni service OAuth n'y figure. La mise en production doit être réalisée
> par le propriétaire du dépôt (comptes GitHub/Cloudflare). Le mode local, lui, ne dépend pas
> d'OAuth.

## Sécurité

- **Aucun secret dans le dépôt** : le client OAuth (et son secret) vit uniquement dans les
  variables du worker OAuth, côté infrastructure ; `/admin` reste en `noindex` (ce n'est pas une
  mesure de sécurité, l'authentification GitHub est la barrière).
- **`local_backend` strictement localhost** : `decap-server` n'a pas d'authentification.
- **Dépendances** : versions épinglées et installation reproductible (`npm ci` +
  `package-lock.json`).
- **Audit npm** (état au 25/11/2026, non corrigé pour préserver les versions épinglées exigées) :
  - `npm audit --omit=dev` : **7 vulnérabilités `high`**, 0 `critical`/`moderate`/`low` —
    chaîne transitive Decap (`trim`, ReDoS) via `remark-parse`/`remark-rehype` des widgets
    Markdown. **Aucun correctif amont** n'est disponible dans la chaîne actuelle ; cet impact est
    limité à l'éditeur admin, authentifié, qui manipule son propre contenu Markdown.
  - `npm audit` (prod + dev) : **11 vulnérabilités `high`** (les 7 ci-dessus + `decap-server` et sa
    chaîne dev `@decap/cli`/`@hapi/joi`/`zod`). `decap-server` est une dépendance **de
    développement**, jamais déployée.
  - Ne pas lancer `npm audit fix --force` : cela remplacerait des versions épinglées par des
    versions majeures non validées. Réévaluer l'audit à chaque montée de version de Decap.

## Note technique : Astro 7 et l'emplacement legacy

Astro 7 attend par défaut la configuration de contenu dans `src/content.config.ts`. Ce projet
conserve volontairement **`src/content/config.ts`** (exigence projet) : le flag officiel
`legacy.collectionsBackwardsCompat: true` dans `astro.config.mjs` rétablit l'emplacement legacy et
l'API historique (`defineCollection` sans `loader`, `z` depuis `astro/zod`, `getCollection` +
`render(entry)`).

**Migration future** (non faite ici) : déplacer la déclaration vers `src/content.config.ts`, passer
à `defineCollection({ loader: glob({ base: './src/content/blog', pattern: '**/*.md' }) })`, adapter
les imports (`getCollection`/`render` restent disponibles) et remplacer la dérivation de slug
`entryIdToSlug(entry.id)` (en mode legacy, `id` inclut l'extension `.md`) par le `slug`/`id` du
loader. Cette migration est fonctionnellement neutre pour le thème et le CMS.

## Limitations connues

- **Médias** : Decap écrit des chemins absolus (`/images/uploads/...`). Ils sont réécrits au rendu
  par le plugin rehype `src/utils/rehype-base-images.mjs` : images et liens internes écrits en
  Markdown fonctionnent à la racine comme sous `/mon-skyblog`. Limite résiduelle : les **aperçus
  d'images dans l'interface du CMS** restent absolus et peuvent ne pas s'afficher sous une base de
  projet — le contenu publié, lui, est correct.
- **Éléments de démonstration** : compteur de visites fictif, livre d'or et commentaires fictifs —
  tous explicitement étiquetés ; aucun formulaire n'est connecté, aucune donnée n'est collectée.
- **Page article** : le `cover` du frontmatter est géré par les cartes d'accueil mais pas encore
  affiché en tête d'article (limitation connue, non bloquante).
- **Pas de prévisualisation serveur** : le CMS est une interface statique ; la prévisualisation
  éventuelle est côté site.
- **Validation visuelle** : l'environnement de build n'a pas de navigateur exploitable ; les
  contrôles visuels (responsive 320–375 px / 800×600 / desktop, reduced-motion, pause du marquee
  au clavier, focus, webring) sont à faire à la main — recette dans `docs/PLAN.md`.

## Checklist de mise en ligne

- [ ] Créer le dépôt GitHub et pousser `main` ;
- [ ] **Settings → Pages → Source = GitHub Actions** ;
- [ ] (Facultatif) variables `SITE_URL` / `BASE_PATH` ; domaine personnalisé si besoin ;
- [ ] Vérifier le premier déploiement du workflow (Actions) et l'URL publiée ;
- [ ] Vérifier `/`, un article, `/404`, `/admin/` (page statique) et le favicon ;
- [ ] Réaliser l'OAuth de production : voir `docs/decap-oauth.md` (worker + secrets + `repo` +
      `base_url`), puis tester connexion/écriture/commit/déploiement ;
- [ ] Relire l'audit npm (état connu ci-dessus) et les secrets (aucun commit ne doit contenir de
      jeton) ;
- [ ] Faire la recette de validation visuelle manuelle (docs/PLAN.md) ;
- [ ] Mettre à jour les placeholders `owner/repo` et `base_url` — **uniquement** le jour de la
      mise en production.

## Documentation

- [`docs/PLAN.md`](docs/PLAN.md) — plan initial, décisions techniques, historique des tâches et
  commits, revues/rejets, état final, risques et actions humaines restantes.
- [`docs/decap-oauth.md`](docs/decap-oauth.md) — OAuth Decap CMS en production (options, procédure
  worker + GitHub App/OAuth App, checklist sécurité, tests, limitations).

## Crédits

Site de démonstration construit avec [Astro](https://astro.build) et
[Decap CMS](https://decapcms.org) (MIT), polices système uniquement, aucun asset distant. Contenu
rédactionnel fictif à but pédagogique ; pas de licence explicite ajoutée à ce stade.
