# Plan de projet — Mon Skyblog

Ce document retrace le **plan initial**, les **décisions techniques**, l'**historique des tâches et
commits**, les **revues/rejets** et l'**état final** du projet, ainsi que les risques résiduels et
les actions humaines restantes. Il est destiné à la livraison et à la maintenance.

## 1. Objectif

Construire un site statique « journal rétro Skyblog 1990-2000 » fonctionnel, éditable et
déployable :

- Astro **7.4.13** en sortie `static`, collection de contenu Markdown typée, article de démo ;
- thème rétro fidèle mais **accessible** et **léger** ;
- administration **Decap CMS** auto-hébergée (`/admin/`), sans CDN ;
- déploiement **GitHub Pages** automatisé (base-aware page utilisateur ou page de projet) ;
- documentation opérationnelle, en particulier l'**OAuth de production** (aucun secret committé).

Contraintes imposées au départ : workspace vide (Node 24 / npm 11), cache npm global en lecture
seule (`npm --cache .npm-cache`), versions épinglées, `src/content/config.ts` conservé (emplacement
legacy), administration auto-hébergée, aucune police/image distante, zéro JS sur les pages
publiques.

## 2. Plan initial (T1 → T6)

| Tâche | Objectif | Livrables principaux | Critères d'acceptation |
| --- | --- | --- | --- |
| **T1** | Scaffold Astro + collection + article démo | `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/content/config.ts`, article, layout, pages, README | build OK, page d'accueil et article rendus, frontmatter invalide → échec du build, commit initial |
| **T2** | Intégration Decap CMS auto-hébergée | `decap-cms-app@3.18.0` + React 19, `decap-server@3.11.6`, `src/pages/admin/index.astro`, `public/admin/config.yml`, script `cms`, README | `/admin/` 200, config YAML alignée 1:1 sur le schéma, bundle local (0 CDN), `decap-server` démarre |
| **T3** | CI/CD GitHub Pages + base-aware | `.github/workflows/deploy.yml`, `site`/`base` paramétrables, `withBase()`, `.nojekyll`, README | build défaut et `/skyblog` OK, liens/assets préfixés, workflow valide/sans secret |
| **T4** | Thème rétro accessible | `src/styles/skyblog.css`, 10 composants `src/components/`, layout/pages refondus, favicon SVG, 2 articles de plus | 1 seul h1, 0 JS public, 0 requête externe, contrastes AA, `prefers-reduced-motion`, marquee avec pause (WCAG 2.2.2), `lang` des passages anglais (3.1.2) |
| **T5** | Documentation OAuth production | `docs/decap-oauth.md`, README enrichi, placeholders clarifiés dans `public/admin/config.yml` | procédure sourcée, checklists sécurité/tests, aucun secret, mode local intact |
| **T6** | QA finale + doc de livraison | README final, ce `docs/PLAN.md`, corrections de la doc OAuth | `npm ci` + builds OK, audits non-régression, poids/sécurité, cohérence schéma/CMS/docs, arbre propre |

## 3. Décisions techniques clés

1. **Astro 7.4.13 exact + flag legacy.** Astro 7 attend `src/content.config.ts` ; l'exigence projet
   impose `src/content/config.ts`. Le flag officiel
   `legacy.collectionsBackwardsCompat: true` (dans `astro.config.mjs`) rétablit l'emplacement et
   l'API legacy (`defineCollection` sans loader, `z` depuis `astro/zod`). Le rendu utilise
   `render(entry)` de `astro:content`. En mode legacy, `entry.id` inclut l'extension `.md` : un
   petit utilitaire (`src/utils/slug.ts`) dérive le slug d'URL.
2. **Decap CMS auto-hébergé, sans CDN.** `decap-cms-app@3.18.0` est bundlé par Vite dans un script
   module local ; React 19 est installé en peer dependency ; `decap-server@3.11.6` (dev) sert de
   proxy pour le mode local. La page admin est statique (`noindex`), le lien
   `<link rel="cms-config-url" type="text/yaml">` est base-aware. Constats vérifiés dans le
   paquet : `CMS.init()` crée `#nc-root` si absent ; l'attribut `type` du lien config est requis
   par `getConfigUrl()`.
3. **Base-aware de bout en bout.** `astro.config.mjs` lit `SITE_URL` et `BASE_PATH`
   (normalisation : `/` par défaut, pas de slash final) ; tous les liens internes passent par
   `withBase()` (`src/utils/base.ts`) ; le workflow GitHub Actions transmet ces valeurs à Astro
   via des **step outputs** (`$GITHUB_OUTPUT`), mécanisme documenté — l'utilisation du contexte
   `env` alimenté par `$GITHUB_ENV` a été écartée (non garanti, correctif de revue T3).
4. **Zéro JS public, accessibilité d'abord.** Seule la page admin charge un script. Le marquee est
   animé en CSS avec un **contrôle de pause visible et clavier** (case à cocher + label, sans JS),
   `prefers-reduced-motion` fige tout, les libellés anglais portent `lang="en"`, contrastes AA et
   focus visibles vérifiés.
5. **OAuth de production préparé, non déployé.** Le backend GitHub nécessite un service OAuth
   externe ; l'option A (worker Cloudflare type `sveltia-cms-auth` + GitHub App ou OAuth App) est
   documentée pas à pas, avec Decap Turbo et les clients communautaires en alternatives. Aucun
   secret, compte ou worker n'existe dans ce dépôt : la mise en œuvre revient au propriétaire.
6. **Sécurité et reproductibilité.** Versions épinglées, `npm ci` depuis le lockfile, aucun secret
   committé, `/admin` en `noindex`, `local_backend` réservé à localhost. L'audit npm est documenté
   honnêtement (voir §6).
7. **Médias base-aware.** Decap insère des chemins absolus (`/images/uploads/...`). Le pipeline
   Markdown unified (`@astrojs/markdown-remark`) et le plugin rehype
   `src/utils/rehype-base-images.mjs` préfixent au rendu les `src` d'images et `href` internes avec
   le `base` du site (racine ou `/mon-skyblog`), sans modifier le Markdown stocké dans le dépôt.
   Seuls les aperçus d'images dans l'interface d'administration restent absolus.

## 4. Historique des tâches et commits

| Tâche | Commit(s) | Résumé |
| --- | --- | --- |
| T1 | `4f6ea92` | Scaffold Astro 7.4.13 + collection legacy `src/content/config.ts` + article démo + layout/pages |
| T2 | `5529465` | Decap CMS 3.18.0 auto-hébergé (`/admin/`), config collection `blog`, mode local `decap-server` |
| T3 | `06eb7b0`, `8325587` | Workflow GitHub Pages, `SITE_URL`/`BASE_PATH`, liens base-aware, `.nojekyll` ; correctif de robustesse du workflow (step outputs, `env`, permissions au niveau job) |
| T4 | `de3be67`, `4a85f78` | Thème rétro accessible (CSS global + 10 composants + 2 articles) ; correctifs accessibilité (pause marquee WCAG 2.2.2, `lang` 3.1.2) |
| T5 | `a1ac3b2` | Documentation OAuth de production (`docs/decap-oauth.md`), README, placeholders clarifiés |
| T6 | `a486e9d` + commit de corrections de la revue finale | QA finale, README de livraison, `docs/PLAN.md`, corrections de la doc OAuth |

## 5. Revues et rejets

Les tâches T1, T2 et T5 ont été approuvées telles que soumises. Deux tâches ont fait l'objet d'un
rejet, avec explication de la cause puis correction (pas d'improvisation) :

- **T3 — rejeté (itération 1)** : le workflow GitHub Pages était fragile.
  - *Cause* : (1) relecture de valeurs écrites dans `$GITHUB_ENV` via le contexte `env` des
    expressions — non garanti par la documentation, risque de `SITE_URL`/`BASE_PATH` vides et de
    liens cassés silencieusement sur une page de projet ; (2) interpolation directe d'expressions
    `${{ … }}` dans un script shell (valeurs de `vars` non échappées → casse ou injection
    possible) ; (3) permissions plus larges que nécessaire.
  - *Correction* (`8325587`) : step `id: config` + écriture dans `$GITHUB_OUTPUT`, valeurs passées
    par `env:` et lues comme variables shell, `withastro/action` alimenté par
    `${{ steps.config.outputs.* }}`, permissions `contents: read` au niveau workflow et
    `pages: write`/`id-token: write` sur le seul job `deploy`.
- **T4 — rejeté (itération 1)** : deux points d'accessibilité bloquants.
  - *Cause* : (1) WCAG 2.2.2 (Pause, Stop, Hide) — le marquee et l'étoile clignotaient en boucle
    sans **mécanisme in-page** de pause ; `prefers-reduced-motion` est une préférence système, elle
    ne fournit pas ce contrôle à un utilisateur qui ne l'active pas ; (2) WCAG 3.1.2 — les passages
    anglais n'avaient pas `lang="en"` dans un document `lang="fr"`.
  - *Correction* (`4a85f78`) : case à cocher + label visibles et clavier pour mettre le marquee en
    pause (`#pause-defilement:checked ~ .marquee .marquee__track { animation-play-state: paused }`),
    contrôle hors sous-arbre `aria-hidden`, focus visible, étoile rendue statique, `lang="en"` sur
    les badges et mentions anglaises.

## 6. État final

- **Build** : `npm ci` puis `npm run build` → **6 pages** (`/`, `/404`, 3 articles, `/admin/`) ;
  build avec `SITE_URL`/`BASE_PATH=/skyblog` OK, liens et assets préfixés.
- **Poids** : CSS global **12 951 octets** (< 40 Ko) ; pages HTML **2,9 – 9,3 Ko** (≤ ~22 Ko
  HTML+CSS) ; `dist/` ≈ **7,2 Mo**, dominé par le bundle admin Decap (~5,6 Mo, chargé uniquement
  sur `/admin/`).
- **Accessibilité** : 1 `h1`/page, header/nav/main/footer, skip-link, `lang="fr"`, meta
  descriptions, focus visibles, contrastes AA (27 paires vérifiées, ≥ 4.5:1), marquee avec pause
  + `prefers-reduced-motion`, `lang="en"` sur les passages anglais, décorations `aria-hidden`.
- **Sécurité / sobriété** : 0 `<script>` sur les pages publiques, 0 balise
  `<marquee>/<blink>/<table>`, 0 `url()`/`@import`/police distante dans le CSS, aucun secret,
  `/admin` en `noindex`, `local_backend` limité à localhost.
- **Contenu** : 3 articles de démonstration datés 2005, triés par date décroissante ; schéma strict
  (7 champs frontmatter + corps Markdown) aligné 1:1 sur les champs Decap.
- **Audit npm** (état au 25/11/2026, versions épinglées conservées) : `--omit=dev` → **7 `high`**
  (chaîne transitive Decap, `trim` ReDoS via `remark-parse`/`remark-rehype`, pas de correctif
  amont, impact limité à l'éditeur admin authentifié) ; audit complet → **11 `high`** (ajout de la
  chaîne dev `decap-server`/`@decap/cli`/`@hapi/joi`/`zod`) ; aucun `critical`. Ne pas lancer
  `npm audit fix --force` (remplacement de versions majeures épinglées).

## 7. Risques résiduels et actions humaines restantes

| Sujet | Risque / action | Priorité |
| --- | --- | --- |
| **Infra OAuth réelle** | Aucun worker, OAuth App/GitHub App, ni secret n'existe : création et configuration à faire par le propriétaire en suivant `docs/decap-oauth.md` ; valider la connexion (compatibilité worker à confirmer lors du test) | **Bloquant pour la production** |
| **Identité du dépôt et du site** | Remplacer `repo: owner/repo` et `base_url` (placeholders) ; définir le domaine (`SITE_URL`) et la source Pages (GitHub Actions) | **Avant mise en ligne** |
| **Validation navigateur** | Aucun navigateur exploitable dans l'environnement de build : recette visuelle manuelle (voir §8) — responsive 320–375 px / 800×600 / desktop, reduced-motion, pause du marquee au clavier, focus, webring | Avant validation finale |
| **Audit npm** | 7 (prod) / 11 (total) alertes `high` transitives, sans correctif amont dans les versions épinglées ; réévaluer à chaque montée de version de Decap, ne pas forcer de changement majeur | Suivi régulier |
| **Médias et base de projet** | Réglé pour les pages publiées (réécriture base-aware au rendu via `rehype-base-images.mjs`) ; seuls les aperçus d'images dans l'interface admin restent absolus et peuvent ne pas s'afficher sous une base de projet | Suivi mineur |
| **Page article et `cover`** | Le `cover` du frontmatter est géré par les cartes d'accueil mais pas affiché en tête d'article (non bloquant) | Confort / évolution |
| **Worker OAuth** | Dépendance d'infrastructure à maintenir (mises à jour de sécurité, quotas, disponibilité Cloudflare) ; épingler la version déployée | Suivi régulier |
| **Accès GitHub** | Decap exige un accès en push ; retirer les anciens collaborateurs ; envisager `publish_mode: editorial_workflow` et/ou des protections de branche | Avant ouverture aux éditeurs |
| **Licence** | Aucun fichier `LICENSE` ajouté ; à définir si le dépôt devient public | À décider |

## 8. Recette de validation visuelle manuelle (navigateur)

Aucun navigateur n'est disponible dans l'environnement de build (Chromium sans bibliothèques
système). À vérifier à la main sur le site servi (`npm run dev` ou `npm run preview`) :

1. Desktop : bannière dégradée magenta/violet, titre Comic Sans jaune en relief, nav colorée,
   marquee jaune défilant lentement.
2. Accueil ≥ 900 px : grille 2 colonnes (articles + sidebar) ; < 900 px : empilement.
3. 800×600 : site complet, pas de scroll horizontal, marquee visible.
4. 320–375 px : nav repliée, profil centré, prose lisible, aucun débordement horizontal.
5. `prefers-reduced-motion` activé : marquee figé et entièrement lisible, plus aucune animation.
6. Clavier : Tab → skip-link visible ; focus noir/jaune ; Tab jusqu'à « Pause du défilé » puis
   Espace → le texte s'arrête et le libellé devient « Reprendre le défilé ».
7. Article : fil d'Ariane, tags, prose (bloc-citation, code, séparateur pointillé), commentaires
   étiquetés « démonstration », navigation précédent/suivant, lien retour.
8. Page 404, favicon d'onglet, liens du webring ouverts dans un nouvel onglet (mention
   « nouvelle fenêtre » pour les lecteurs d'écran).

## 9. Références

- Astro — documentation : https://docs.astro.build
- Decap CMS — GitHub backend : https://decapcms.org/docs/github-backend/
- Decap CMS — configuration : https://decapcms.org/docs/configuration-options/
- Decap CMS — proxy local : https://decapcms.org/docs/decap-proxy/
- Decap CMS — External OAuth Clients : https://decapcms.org/docs/external-oauth-clients/
- Decap Turbo : https://decapcms.org/docs/turbo-overview/
- Sveltia CMS Authenticator (worker Cloudflare) : https://github.com/sveltia/sveltia-cms-auth
- GitHub Pages (workflow `withastro/action`) : https://docs.astro.build/en/guides/deploy/github/
