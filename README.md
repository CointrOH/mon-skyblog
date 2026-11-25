# Mon Skyblog

**En ligne : [https://cointroh.github.io/mon-skyblog/](https://cointroh.github.io/mon-skyblog/)** · **Dépôt : [CointrOH/mon-skyblog](https://github.com/CointrOH/mon-skyblog)**

Journal rétro « Skyblog 1990-2000 » construit avec **Astro** et éditable via **Decap CMS**.
Articles de démonstration, images de couverture et images dans le texte, galerie de GIF alimentée
depuis l'administration, commentaires et livre d'or via **Giscus** (GitHub Discussions), compteur
**GoatCounter**, page de confidentialité, thème accessible et volontairement daté (bannière,
marquee, webring), rendu statique déployable sur GitHub Pages, et une administration auto-hébergée
en `/admin/` (aucun CDN).

## Fonctionnalités

- **Site statique** (Astro, sortie `static`) : accueil avec liste d'articles triée par date,
  pages d'article au Markdown enrichi, images de couverture et images inline, page 404 thématisée,
  favicon SVG local.
- **Collection de contenu `blog`** typée par un schéma Zod strict : article rendu depuis
  `src/content/blog/*.md`, brouillons exclus de la production.
- **Collection `gallery`** réservée à l'administration : GIF uploadés via Decap, page `/galerie/`
  avec grille, état vide, masquage accessible et respect de `prefers-reduced-motion`.
- **CMS Decap** sur `/admin/` : interface en français, paquet npm auto-hébergé (aucun script
  distant), écriture directe des fichiers Markdown en local via `decap-server` ; collections
  `blog` et `gallery`.
- **Commentaires Giscus** (GitHub Discussions) sur chaque article et **livre d'or** sur
  `/livre-d-or/`, via un composant commun ; les messages sont publics et nécessitent un compte
  GitHub.
- **Compteur GoatCounter** réel (sans cookie) : comptage sur toutes les pages publiques,
  affichage sur l'accueil, avec repli honnête « activation en cours » tant que le site
  GoatCounter n'est pas configuré.
- **Page `/confidentialite/`** : données traitées, finalités et bases légales, sous-traitants,
  durées, droits RGPD, cookies.
- **Thème rétro accessible** : polices 100 % système, motifs CSS, cadres biseautés, bannière
  dégradée, marquee CSS **avec contrôle de pause** (WCAG 2.2.2), `prefers-reduced-motion`,
  contrastes AA vérifiés, skip-link, focus visible, `lang` correct sur les passages anglais.
- **JavaScript minimal et documenté** : scripts Giscus et GoatCounter, scripts inline de la galerie
  et du compteur ; le contenu reste consultable sans JS (voir « Scripts et requêtes externes »).
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

Aucune autre dépendance que celles listées : pas de police distante, pas de framework côté public.
Le JavaScript public se limite aux services documentés (Giscus, GoatCounter) et à quelques scripts
inline ; la page admin charge Decap, bundlé localement.

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
├── giscus-theme.css           # Thème rétro de l'iframe Giscus (data-theme en production)
├── admin/
│   └── config.yml             # Configuration Decap CMS (backend, collections blog + gallery)
└── images/
    └── uploads/               # Médias déposés via le CMS (public_folder /images/uploads)
src/
├── components/                # Composants présentationnels + widget Giscus
│   ├── ArticleNav.astro       # Navigation précédent/suivant
│   ├── Badges.astro           # Badges rétro + « under construction » SVG
│   ├── Banner.astro           # Bannière dégradée (titre non h1)
│   ├── Comments.astro         # Commentaires Giscus (articles + livre d'or)
│   ├── Footer.astro           # Pied de page (liens confidentialité, galerie…)
│   ├── Guestbook.astro        # Teaser du livre d'or vers /livre-d-or/
│   ├── Marquee.astro          # Bandeau défilant CSS + contrôle de pause
│   ├── Nav.astro              # Navigation principale
│   ├── PostCard.astro         # Carte d'article (liste d'accueil)
│   ├── VisitCounter.astro     # Compteur GoatCounter (repli si non configuré)
│   └── Webring.astro          # Webring (liens externes rel="noopener noreferrer")
├── config/
│   └── site.ts                # Configuration publique : Giscus, GoatCounter, contact RGPD
├── content/
│   ├── config.ts              # Schémas Zod des collections « blog » et « gallery » (legacy)
│   ├── blog/                  # Articles Markdown (dont test.md)
│   └── gallery/               # Entrées de la galerie, créées via /admin/
├── layouts/
│   └── BaseLayout.astro       # Gabarit HTML5 commun (+ meta CSP, script de comptage global)
├── pages/
│   ├── index.astro            # Accueil : liste + sidebar (grille 2 colonnes)
│   ├── 404.astro              # Page introuvable thématisée
│   ├── admin/index.astro      # Interface d'administration Decap CMS (/admin/)
│   ├── blog/[slug].astro      # Page d'un article (couverture, prose, commentaires Giscus)
│   ├── galerie.astro          # Galerie de GIF (masquage, reduced-motion, état vide)
│   ├── livre-d-or.astro       # Livre d'or (même composant Giscus)
│   └── confidentialite.astro  # Politique de confidentialité et droits RGPD
├── styles/
│   └── skyblog.css            # Feuille globale unique du thème (sections commentées)
└── utils/
    ├── base.ts                # withBase() : préfixe les liens internes par le base path
    ├── rehype-base-images.mjs # Réécrit les chemins absolus du Markdown (images, liens)
    └── slug.ts                # Conversion identifiant de contenu → slug d'URL
```

## Gestion du contenu

Les collections `blog` et `gallery` sont déclarées dans **`src/content/config.ts`** avec l'API
legacy d'Astro (`defineCollection` sans `loader`, `z` importé depuis `astro/zod`) et des schémas
**stricts**.

### Collection `blog`

| Champ | Type / contrainte | Défaut |
| --- | --- | --- |
| `title` | string, min. 3 caractères | requis |
| `date` | date coercée (`z.coerce.date()`) | requis |
| `description` | string, min. 10 caractères | requis |
| `author` | string | `Le Webmaster` |
| `tags` | tableau de strings | `[]` |
| `cover` | string optionnelle (chemin d'image) | — |
| `coverAlt` | string optionnelle (texte alternatif de la couverture) | — |
| `coverCaption` | string optionnelle (légende visible sous la couverture) | — |
| `draft` | booléen | `false` |

Le Markdown de l'article est le **corps** de l'entrée (champ `body` côté CMS, jamais écrit dans le
frontmatter). Un frontmatter non conforme au schéma fait **échouer le build**.

L'image de couverture se place dans le champ `cover` dédié (elle s'affiche en tête de l'article et
sur les cartes d'accueil) ; les images dans le texte s'insèrent avec le bouton **Image** de la
barre d'outils Markdown de Decap (médiathèque). Pensez à remplir `coverAlt` pour les lecteurs
d'écran.

### Ajouter un article à la main

1. Créer `src/content/blog/mon-article.md` avec un frontmatter conforme ;
2. Écrire le contenu en Markdown (pas de titre `h1` dans le corps : le `h1` vient de la page) ;
3. `npm run build` (ou `npm run dev`). L'article apparaît sur `/` et `/blog/mon-article/`.

Le **slug d'URL** est dérivé du chemin du fichier (`entryIdToSlug()`, `src/utils/slug.ts`) : les
articles en `draft: true` sont exclus des pages générées en production (mais visibles en
développement).

### Galerie de GIF (administration uniquement)

La collection `gallery` stocke les entrées de `/galerie/` dans `src/content/gallery/*.md`. Elle
n'est pas ouverte au public : **seul le webmaster** ajoute des GIF via `/admin/` (collection
« Galerie »), les fichiers allant dans la médiathèque globale `public/images/uploads/`. Évitez les
fichiers lourds (au-delà de ~2 Mo) : les GIF animés sont chargés en différé et peuvent être
masqués.

| Champ | Type / contrainte | Défaut |
| --- | --- | --- |
| `title` | string, min. 2 caractères | requis |
| `date` | date coercée (`z.coerce.date()`) | requis |
| `image` | string optionnelle (chemin médiathèque) | — |
| `externalUrl` | string optionnelle, URL **https** | — |
| `alt` | string, min. 3 caractères | requis |
| `description` | string optionnelle | — |
| `credit` | string optionnelle | — |
| `tags` | tableau de strings | `[]` |

Au moins `image` ou `externalUrl` est requis (raffinement Zod). Sans entrée, la page affiche un
état vide honnête ; le bouton « Masquer les GIFs » et `prefers-reduced-motion` évitent les
animations subies.

### Éditer via le CMS (local)

Deux terminaux : `npm run dev` et `npm run cms`, puis ouvrir
**http://localhost:4321/admin/**. Decap détecte `decap-server` et utilise le backend « proxy »
local : connexion immédiate sans identifiant ni OAuth, écriture **directe** dans
`src/content/blog/*.md` (et `src/content/gallery/*.md`), images dans `public/images/uploads/`. Le
CMS est configuré dans `public/admin/config.yml` (interface `locale: fr`, collections `blog` et
`gallery` alignées 1:1 sur les schémas Astro). Les commentaires et le compteur sont de vrais
services (Giscus et GoatCounter) : voir leurs sections de configuration ci-dessous.

> `decap-server` ne sert **qu'au développement** : il n'a aucune authentification et n'écoute que
> sur localhost. Ne jamais l'exposer en production.

## Thème et accessibilité

- **Feuille unique** `src/styles/skyblog.css`, importée une seule fois dans
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
- **CSP des pages publiques** : meta `Content-Security-Policy` dans `BaseLayout.astro`, limitée aux
  origines de Giscus, de GoatCounter et aux images `https:` (détail dans la section suivante). La
  page `/admin/` garde son propre HTML et n'inclut pas cette CSP.

## Scripts et requêtes externes

Le site n'est plus « zéro JS » ni « zéro requête externe » : c'est un choix assumé (décisions
D-01 à D-04 de `BACKLOG.md`). Voici la liste exhaustive des scripts et requêtes sortantes.

| Origine | Chargée sur | Rôle | Repli sans JS / sans réseau |
| --- | --- | --- | --- |
| `https://giscus.app` (client + iframe) | pages d'article, `/livre-d-or/` | commentaires via GitHub Discussions | lien vers les Discussions GitHub |
| `https://gc.zgo.at`, `https://*.goatcounter.com` | toutes les pages publiques (script) ; widget sur l'accueil | mesure d'audience sans cookie | « — » puis « indisponible » |
| Images `https:` externes | `/galerie/`, si `externalUrl` est utilisé | GIF optionnels | lien direct « Ouvrir le GIF » |

- Les scripts Giscus (`client.js`) et GoatCounter (`count.js`) sont les seuls scripts distants ; la
  CSP les autorise explicitement, ainsi que `api.github.com` pour les requêtes de Giscus.
- Les scripts inline (masquage de la galerie, mise à jour du compteur) sont couverts par
  `'unsafe-inline'` et documentés directement dans les composants.
- Aucun cookie de mesure : GoatCounter fonctionne sans cookie. GitHub peut déposer ses propres
  cookies dans l'iframe de commentaires (voir `/confidentialite/`).
- Le bundle Decap de `/admin/` est servi localement (aucun CDN) ; cette page n'inclut pas la CSP.

## Configuration des commentaires (Giscus)

Les commentaires des articles et le livre d'or utilisent le **même composant**
(`src/components/Comments.astro`) et le même backend : **GitHub Discussions** via
[Giscus](https://giscus.app). Gratuit, sans serveur, sans modération manuelle (D-03 et D-08).

**Prérequis** : les Discussions GitHub sont activées sur `CointrOH/mon-skyblog`. L'application
giscus doit être installée par le propriétaire (une seule fois) : le code est prêt, mais l'iframe ne
pourra afficher les commentaires qu'après cette installation.

**Installation (une seule fois)** :

1. Ouvrir <https://github.com/apps/giscus/installations/new> ;
2. Autoriser l'application sur le dépôt `CointrOH/mon-skyblog` (accès aux Discussions) ;
3. Recharger une page d'article ou `/livre-d-or/` : la zone de commentaires doit apparaître.

**Identifiants** (publics, dans `src/config/site.ts`) :

| Paramètre | Valeur |
| --- | --- |
| `repo` | `CointrOH/mon-skyblog` |
| `repoId` | `R_kgDOV7a4xQ` |
| `category` | `Announcements` |
| `categoryId` | `DIC_kwDOV7a4xc4DL8UZ` |
| `mapping` | `pathname` |
| `theme` / `lang` / `loading` | `light` / `fr` / `lazy` |

Le mapping `pathname` crée une discussion par chemin de page : les articles et `/livre-d-or/` ont
donc chacun la leur. **Participation** : un compte GitHub est nécessaire ; les messages sont
publics et s'affichent immédiatement (pas de modération a priori, suppression a posteriori dans
l'onglet Discussions du dépôt). Chaque bloc renvoie vers `/confidentialite/`.

En production, l'iframe Giscus reçoit l'URL absolue (base-aware) du thème rétro auto-hébergé
`public/giscus-theme.css` via `data-theme` ; en développement, le thème `light` est conservé pour
éviter les problèmes CORS. Le fichier de thème est fourni avec la feuille de style du site.

## Configuration du compteur (GoatCounter)

Le compteur [GoatCounter](https://www.goatcounter.com) (gratuit, sans cookie, hébergé en UE — D-04)
est un vrai compteur : le script `count.js` est chargé sur **toutes les pages publiques** par
`BaseLayout.astro`, et le widget de la sidebar d'accueil affiche le total. Tant que le site n'est
pas configuré, il affiche « — » et « activation en cours » : aucun script externe n'est chargé.

**Mise en service (une seule fois)** :

1. Créer un site sur <https://www.goatcounter.com> (choisir un code, par exemple `mon-skyblog`) ;
2. Dans les réglages du site GoatCounter, **activer « Allow adding visitor counts on your website »**
   (sans cette option, l'endpoint `/counter/TOTAL.json` reste fermé et le widget affiche
   « indisponible ») ;
3. Toujours dans les réglages, **désactiver les collectes optionnelles** (navigateur, taille
   d'écran, localisation) : seules les pages vues, les totaux et les référents agrégés sont
   conservés ;
4. Dans GitHub : **Settings → Secrets and variables → Actions → Variables**, ajouter
   `GOATCOUNTER_CODE` = code du site (variable publique, pas un secret) ;
5. Pousser sur `main` (ou lancer le workflow) : `deploy.yml` transmet
   `PUBLIC_GOATCOUNTER_CODE` au build.

En local : `PUBLIC_GOATCOUNTER_CODE=mon-skyblog npm run build`.

`BaseLayout` charge `https://gc.zgo.at/count.js` (attribut `data-goatcounter`) sur chaque page
publique ; le widget interroge `https://<code>.goatcounter.com/counter/TOTAL.json` pour afficher les
chiffres. Le code est validé par `^[a-z0-9-]+$` ; en cas d'échec réseau, le libellé affiche
« indisponible » sans casser la page. GoatCounter met le total en cache **4 h** : le chiffre n'est
pas instantané.

## Déploiement GitHub Pages

Le déploiement est automatisé par [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) :
push sur `main` (ou lancement manuel), build puis publication de l'artefact `dist/`.

**Prérequis (une seule fois)** :

1. Pousser le dépôt sur GitHub ;
2. **Settings → Pages → Source = GitHub Actions** ;
3. (Optionnel) **Settings → Secrets and variables → Actions → Variables** :
   - `SITE_URL` — URL publique du site (utile pour un domaine personnalisé) ;
   - `BASE_PATH` — chemin de base si vous voulez forcer une valeur ;
   - `GOATCOUNTER_CODE` — code public du site GoatCounter (active le compteur réel).

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

Le backend GitHub de Decap ne peut pas s'authentifier depuis un site statique : un petit
**service OAuth externe** est utilisé (worker Cloudflare `sveltia-cms-auth` + GitHub App
`Mon Skyblog Admin`). Procédure de référence, sécurité et tests :
**[`docs/decap-oauth.md`](docs/decap-oauth.md)**.

**Configuration en production (25/11/2026)** :

- `backend.repo` : `CointrOH/mon-skyblog` ;
- `backend.base_url` : `https://sveltia-cms-auth.sebastien-zambernardi.workers.dev`
  (origine seule, sans slash final) ;
- GitHub App installée **uniquement sur ce dépôt** (Contents = Read and write, Metadata =
  Read-only) ;
- `ALLOWED_DOMAINS` du worker : `cointroh.github.io` ;
- le **client secret** vit uniquement dans les variables Cloudflare : aucun secret dans le dépôt.

> **Qui peut éditer ?** N'importe quel compte GitHub peut *autoriser* l'application OAuth, mais
> Decap CMS exige un **droit d'écriture (push) sur le dépôt** pour lire ou écrire le contenu :
> seuls le propriétaire et les éventuels collaborateurs ayant ce droit peuvent réellement éditer.
> Il n'existe pas de liste d'utilisateurs côté worker : la barrière est celle des permissions
> GitHub du dépôt. Vérifier régulièrement **Settings → Collaborators** du dépôt.

## Sécurité

- **Aucun secret dans le dépôt** : le client OAuth (et son secret) vit uniquement dans les
  variables du worker OAuth, côté infrastructure ; `/admin` reste en `noindex` (ce n'est pas une
  mesure de sécurité, l'authentification GitHub est la barrière).
- **Édition = droit d'écriture GitHub** : le worker OAuth délivre un jeton à tout compte GitHub
  qui autorise l'app, mais Decap ne peut lire/écrire le contenu que si ce compte a un **accès push
  au dépôt**. Aucune liste d'utilisateurs n'est gérée côté worker ; la barrière est celle des
  permissions GitHub du dépôt.
- **CSP** : les pages publiques déclarent une `Content-Security-Policy` restrictive (Giscus,
  GoatCounter, images `https:`/`data:` uniquement) ; `/admin/` n'est pas concerné.
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
  par le plugin rehype `src/utils/rehype-base-images.mjs` : couverture, images inline et liens
  internes fonctionnent à la racine comme sous `/mon-skyblog`. Limite résiduelle : les **aperçus
  d'images dans l'interface du CMS** restent absolus et peuvent ne pas s'afficher sous une base de
  projet — le contenu publié, lui, est correct.
- **Commentaires** : un **compte GitHub** est nécessaire pour participer ; les messages sont
  publics. L'application giscus doit être installée par le propriétaire sur le dépôt (voir
  « Configuration des commentaires (Giscus) ») ; sans elle, le bloc reste vide même si le script
  est chargé.
- **Compteur** : total GoatCounter mis en cache **4 h** (pas d'instantané). Le script de comptage
  est chargé sur toutes les pages publiques (total site-wide) ; seul le widget de l'accueil affiche
  le chiffre.
- **Contact RGPD** : l'adresse dédiée est **à créer** et à renseigner dans `src/config/site.ts`
  (`contactEmail`). En attendant, la page Confidentialité renvoie vers les Discussions GitHub.
- **GIFs animés** : ils peuvent être lourds et distrayants ; la galerie limite les dégâts (chargement
  différé, masquage accessible, `prefers-reduced-motion`) mais le webmaster doit éviter les fichiers
  de plus de ~2 Mo et remplir le texte alternatif. Une couverture au format GIF s'anime aussi sur la
  page article et les cartes, sans contrôle de pause dédié : pour une accessibilité stricte,
  préférer une image statique (JPG/PNG) en couverture.
- **Pas de prévisualisation serveur** : le CMS est une interface statique ; la prévisualisation
  éventuelle est côté site.
- **Validation visuelle** : l'environnement de build n'a pas de navigateur exploitable ; les
  contrôles visuels (responsive 320–375 px / 800×600 / desktop, reduced-motion, masquage des GIFs,
  focus, giscus, compteur) sont à faire à la main — recette dans `docs/PLAN.md`.

## Checklist de mise en ligne

**Déjà fait (25/11/2026)** :

- [x] Dépôt GitHub `CointrOH/mon-skyblog` et branche `main` poussés ;
- [x] **Settings → Pages → Source = GitHub Actions** (déploiement automatique) ;
- [x] OAuth de production configuré (worker Cloudflare + GitHub App + `base_url`) et connexion
      `/admin/` testée ;
- [x] `repo` et `base_url` renseignés dans `public/admin/config.yml` (aucun secret dans le dépôt).

**À faire côté propriétaire (services externes)** :

- [ ] **Installer l'application giscus** sur le dépôt :
      <https://github.com/apps/giscus/installations/new> (les Discussions sont déjà activées) ;
- [ ] **Créer le site GoatCounter** puis la variable `GOATCOUNTER_CODE`
      (Settings → Secrets and variables → Actions → Variables) ;
- [ ] **Créer l'adresse email de contact RGPD** et la renseigner dans `src/config/site.ts`
      (`contactEmail`), puis redéployer ;
- [ ] Tester en navigateur : commentaires d'un article, `/livre-d-or/`, compteur, `/galerie/`
      (masquage + `prefers-reduced-motion`), `/confidentialite/`.

**À vérifier côté navigateur** :

- [ ] Recette de validation visuelle manuelle ([docs/PLAN.md](docs/PLAN.md) §8) : responsive,
      reduced-motion, pause du marquee au clavier, focus, webring, galerie ;
- [ ] Vérification rapide en ligne : `/`, un article, `/livre-d-or/`, `/galerie/`,
      `/confidentialite/`, `/404`, `/admin/`, favicon ;
- [ ] Relire l'audit npm (état connu ci-dessus) et vérifier qu'aucun commit ne contient de jeton.

## Documentation

- [`docs/PLAN.md`](docs/PLAN.md) — plan initial, décisions techniques, historique des tâches et
  commits, revues/rejets, état final, risques et actions humaines restantes.
- [`docs/decap-oauth.md`](docs/decap-oauth.md) — OAuth Decap CMS en production (options, procédure
  worker + GitHub App/OAuth App, checklist sécurité, tests, limitations).

## Crédits

Site de démonstration construit avec [Astro](https://astro.build) et
[Decap CMS](https://decapcms.org) (MIT), polices système uniquement. Les services externes se
limitent à Giscus (commentaires, GitHub Discussions) et GoatCounter (compteur sans cookie), plus
les éventuels GIF externes de la galerie. Contenu rédactionnel fictif à but pédagogique ; pas de
licence explicite ajoutée à ce stade.
