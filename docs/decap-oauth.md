# OAuth Decap CMS en production (GitHub Pages)

Ce document décrit **comment rendre l'administration Decap CMS opérationnelle en production**
(dépôt GitHub privé ou public, publication sur GitHub Pages), sans jamais exposer de secret dans
le dépôt ni dans la page statique.

> **État actuel (25/11/2026) : OAuth configuré et testé en production.** Le site
> https://cointroh.github.io/mon-skyblog/ utilise un worker Cloudflare `sveltia-cms-auth`
> (`https://sveltia-cms-auth.sebastien-zambernardi.workers.dev`), une GitHub App
> `Mon Skyblog Admin` installée uniquement sur `CointrOH/mon-skyblog`, et
> `base_url` renseignée dans `public/admin/config.yml`. Aucun secret n'est stocké dans le dépôt :
> le client secret reste dans les variables Cloudflare. La procédure ci-dessous documente la mise
> en place initiale, la maintenance et la remise en état (nouveau worker, rotation de secret,
> changement de dépôt/domaine). Le mode local (`npm run dev` + `npm run cms`) reste indépendant
> de l'OAuth.

Sources officielles consultées : voir la section [Références](#références) en fin de document.

---

## Sommaire

1. [Pourquoi un serveur OAuth est indispensable](#1-pourquoi-un-serveur-oauth-est-indispensable)
2. [Comparatif des options](#2-comparatif-des-options)
3. [Option A — worker OAuth auto-hébergé, pas à pas](#3-option-a--worker-oauth-auto-hébergé-pas-à-pas)
4. [Option B — Decap Turbo (hébergé)](#4-option-b--decap-turbo-hébergé)
5. [Option C — autres clients OAuth communautaires](#5-option-c--autres-clients-oauth-communautaires)
6. [Checklist sécurité](#6-checklist-sécurité)
7. [Checklist de test en production](#7-checklist-de-test-en-production)
8. [Erreurs courantes](#8-erreurs-courantes)
9. [Limitations et risques assumés](#9-limitations-et-risques-assumés)
10. [Références](#références)

---

## 1. Pourquoi un serveur OAuth est indispensable

Le backend `github` de Decap CMS authentifie l'utilisateur via le flux OAuth de GitHub. Ce flux
comporte une étape **serveur** : GitHub redirige l'utilisateur vers une `redirect_uri`, puis le
serveur échange le `code` reçu contre un jeton d'accès en utilisant le **client secret**. Or :

- un site statique hébergé sur GitHub Pages **n'a pas de backend** : il ne peut ni recevoir de
  requête POST de callback, ni conserver un client secret ;
- le client secret **ne doit jamais** être présent dans le code JavaScript envoyé au navigateur
  (il serait public et permettrait de se faire passer pour l'application).

Decap CMS a donc besoin d'un petit service OAuth externe. Dans la configuration Decap, ce service
est désigné par `backend.base_url` ; Decap ouvre une fenêtre popup vers
`<base_url>/<auth_endpoint>?provider=github&site_id=<hôte de la page admin>&scope=<repo|public_repo>`,
et récupère le jeton renvoyé à la page par `postMessage` (le service doit donc renvoyer le jeton
avec l'origine de la page, et non un chemin quelconque : `base_url` est **une origine**, sans
chemin ni slash final).

**Le mode local n'est pas une solution de production.** `local_backend: true` + `decap-server`
sont prévus pour le développement sur `localhost` uniquement : `decap-server` écoute sur le port
8081, n'accepte par défaut que les origines locales, **et n'a aucune authentification** — quiconque
peut l'atteindre peut lire et écrire les fichiers du dépôt local. Il ne faut donc jamais exposer
ce proxy sur Internet ni l'activer dans un déploiement de production.

En résumé, en production le navigateur de l'éditeur parle à GitHub **via** le service OAuth ; le
jeton n'est jamais écrit dans le dépôt, et seul le service OAuth détient le client secret.

---

## 2. Comparatif des options

| Option | Principe | Coût | Complexité | Confiance / dépendances | Recommandation |
| --- | --- | --- | --- | --- | --- |
| **A. Worker OAuth auto-hébergé** (Cloudflare Workers, ex. `sveltia-cms-auth`) | Vous déployez un petit service OAuth ; secrets dans les variables du worker ; implémente le protocole OAuth type Netlify attendu par Decap (compatibilité à valider) | Offre gratuite Cloudflare Workers généralement suffisante ; éventuellement quelques $/mois | Moyenne (compte Cloudflare, création d'une app GitHub, configuration de secrets) | Vous contrôlez le code et les secrets ; dépendance d'infrastructure à maintenir (worker) | **Recommandée** pour ce projet |
| **B. Decap Turbo** (backend hébergé) | Les éditeurs se connectent avec un compte Turbo ; un proxy côté serveur gère GitHub, le cache et les permissions | Payant selon les plans (voir la page tarifs) | Faible (configuration `turbo-github` + `turbo_site_id`) | Dépendance à un service tiers hébergé ; édition sans compte GitHub | Bonne alternative si vous ne voulez pas maintenir de worker |
| **C. Autres clients OAuth communautaires** (liste Decap « External OAuth Clients ») | Projets Node.js, Go, Python, serverless, PHP, Rust, etc. à héberger vous-même | Variable (hébergement du service) | Variable selon le projet choisi | Projets communautaires à auditer/maintenir ; compatibilité à vérifier | Possible, mais moins homogène que l'option A |

**Option A retenue** : c'est la seule qui donne le contrôle complet des secrets et de l'origine,
sans dépendre d'un service payant, tout en restant compatible avec l'architecture statique de
GitHub Pages. Le worker retenu est [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth),
un petit service Cloudflare Workers qui implémente le protocole OAuth de type Netlify utilisé par
Decap CMS (endpoints `auth` et `callback`, jeton renvoyé par `postMessage`).

> Remarque de version : le README actuel de `sveltia-cms-auth` met en avant une **GitHub App**
> (permissions limitées au dépôt concerné) plutôt qu'une **OAuth App** classique ; les deux
> fonctionnent avec ce worker. L'OAuth App reste la procédure la plus classique et la plus proche
> de la documentation GitHub historique ; la GitHub App est plus restrictive et donc préférable en
> termes de moindre privilège. Les deux variantes sont décrites ci-dessous.

> **Compatibilité à valider lors de la mise en place** : `sveltia-cms-auth` est aujourd'hui
> documenté principalement pour **Sveltia CMS**. Il n'est **pas listé** dans la page officielle
> Decap « External OAuth Clients » et ce n'est pas son cas d'usage documenté en priorité. Il
> implémente toutefois le protocole OAuth de type Netlify (endpoints `auth`/`callback`, jeton
> renvoyé par `postMessage`) que consomme le backend GitHub de Decap. **Validez donc la connexion
> réelle (« Login with GitHub ») lors du test de production** ; si une incompatibilité apparaît
> avec votre version de Decap, repliez-vous sur un client de l'option C (liste officielle Decap)
> ou sur Decap Turbo (option B).

---

## 3. Option A — worker OAuth auto-hébergé, pas à pas

### 3.0 Valeurs à fournir au final

| Valeur | Où elle vit | Exemple de forme | Remarque |
| --- | --- | --- | --- |
| `backend.repo` | `public/admin/config.yml` (**dans le dépôt**) | `<owner>/<repo>` | Dépôt réel du site, jamais `owner/repo` |
| `backend.base_url` | `public/admin/config.yml` (**dans le dépôt**) | `https://sveltia-cms-auth.<sous-domaine>.workers.dev` | Origine du worker ; par convention **sans chemin ni slash final** (un slash final produirait un double slash dans `<base_url>/<auth_endpoint>`) |
| `GITHUB_CLIENT_ID` | variables d'environnement **du worker** (pas dans le dépôt) | identifiant public de l'app GitHub | Peut rester côté serveur |
| `GITHUB_CLIENT_SECRET` | **secret** du worker (jamais dans le dépôt) | — | À ne jamais committer, ni afficher |
| `ALLOWED_DOMAINS` | variables d'environnement **du worker** | `cointroh.github.io` | Hôte du site, sans port ni chemin ; plusieurs valeurs séparées par des virgules |

Le dépôt ne contient donc **que** `repo` et `base_url` (non sensibles) ; le client secret reste
exclusivement dans les variables secrètes du worker.

### 3.1 Créer les credentials GitHub

Deux variantes ; choisissez-en **une**.

#### Variante A1 — GitHub App (recommandée par le README du worker)

1. Aller sur **Settings → Developer settings → GitHub Apps → New GitHub App**
   (ou la page « Register new GitHub App »).
2. Renseigner :
   - **GitHub App name** : un nom unique (≤ 34 caractères) ;
   - **Homepage URL** : l'URL du site (ex. `https://<owner>.github.io/<repo>/` ou le domaine
     personnalisé) ;
   - **Redirect URI** : `https://sveltia-cms-auth.<sous-domaine>.workers.dev/callback`
     (**chemin exact** `/callback`, à vérifier dans le README du worker) ;
   - **Expire user authorization tokens** : **coché** (recommandé : jetons à durée limitée) ;
   - **Request user authorization (OAuth) during installation** : **décoché** ;
   - **Enable Device Flow** : **décoché** ;
   - **Webhook → Active** : **décoché** ;
   - permissions : **Contents: Read and write**, **Metadata: Read-only**, et **Pull requests:
     Read and write** uniquement si vous utilisez le workflow éditorial de Decap ; **Workflows**
     seulement si les éditeurs doivent modifier `.github/workflows/` (inutile ici) ;
   - installation : « Only on this account » (ou l'organisation propriétaire du dépôt).
3. Créer l'app, copier le **Client ID**, puis **Credentials → New secret** et copier le secret.
4. **Install App** : installer l'app sur le compte/organisation et sélectionner **uniquement** le
   dépôt du site, avec les permissions ci-dessus.

#### Variante A2 — GitHub OAuth App (flux classique, toujours supporté par le worker)

1. Aller sur **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Renseigner :
   - **Application name** : un nom explicite (ex. « Mon Skyblog Admin ») ;
   - **Homepage URL** : l'URL publique du site ;
   - **Authorization callback URL** : `https://sveltia-cms-auth.<sous-domaine>.workers.dev/callback`
     (chemin `/callback` — vérifiez-le dans le README du worker choisi).
3. Copier le **Client ID** puis générer/copier le **Client secret**.

> Dans les deux variantes : ne jamais coller le client secret dans un fichier du dépôt, dans une
> issue, un commentaire ou une capture d'écran. Seuls le Client ID (non secret) et le secret
> sont à saisir dans les variables du worker (étape 3.3).

### 3.2 Déployer le worker Cloudflare

Deux méthodes, au choix (voir la doc Cloudflare) :

- **Déploiement en un clic** : depuis le dépôt `sveltia-cms-auth`, utiliser le bouton
  « Deploy to Cloudflare Workers » (il crée le service dans votre compte Cloudflare) ;
- **Wrangler en local** : cloner le dépôt du worker, installer ses dépendances dans le projet du
  worker, puis `npx wrangler deploy` (voir la documentation Wrangler). Épingler une version ou un
  commit du worker plutôt que sa branche par défaut, pour maîtriser les mises à jour.

Après déploiement, noter l'URL du worker, de la forme
`https://sveltia-cms-auth.<sous-domaine>.workers.dev`. Elle servira :

- de **Redirect URI / Authorization callback URL** côté GitHub (`<worker>/callback`) ;
- de **`backend.base_url`** côté Decap (origine seule, sans slash final).

### 3.3 Configurer les secrets et variables du worker

Dans le tableau de bord Cloudflare → service worker → **Settings → Runtime variables and secrets**,
ajouter :

| Nom | Type | Contenu |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | variable | Client ID de l'app GitHub (A1) ou de l'OAuth App (A2) |
| `GITHUB_CLIENT_SECRET` | **secret** | Client secret de l'app GitHub (A1) ou de l'OAuth App (A2) |
| `ALLOWED_DOMAINS` | variable | Hôtes autorisés du site, ex. `cointroh.github.io` (pas de port, pas de chemin ; liste séparée par virgules ; wildcard de sous-domaine possible) |
| `GITHUB_HOSTNAME` | variable (option) | Uniquement pour GitHub Enterprise Server ; laisser vide sinon |
| `GITHUB_ALLOW_WORKFLOW_SCOPE` | variable (option) | `true` seulement si les éditeurs doivent modifier `.github/workflows/` (déconseillé) |

`ALLOWED_DOMAINS` est une protection **anti-abus et de sécurité** : sans elle, n'importe quel site
pourrait utiliser votre worker ; elle limite aussi la livraison du jeton aux pages servies depuis
vos hôtes. Renseignez-la avec l'hôte réel du site publié (pour une page de projet GitHub Pages,
l'hôte est `https://<owner>.github.io`, le chemin `/repo` n'entre pas en compte).

Puis **redéployer/sauvegarder** le worker pour appliquer les variables.

### 3.4 Configurer Decap CMS (`public/admin/config.yml`)

Le bloc `backend` doit renseigner le dépôt réel et l'origine du worker. Les placeholders actuels
du dépôt sont à remplacer :

```yaml
backend:
  name: github
  repo: <owner>/<repo>                                   # dépôt réel du site
  branch: main
  base_url: https://sveltia-cms-auth.<compte>.workers.dev  # origine du worker, sans slash final
  auth_endpoint: auth                                     # chemin /auth du worker
  # auth_scope: public_repo                               # option : si le dépôt est public
```

Points d'attention :

- `base_url` : renseigner l'**origine** du worker, sans chemin et **sans slash final**. Dans le code
  Decap, la vérification du `postMessage` compare l'origine extraite de `base_url` (un chemin y est
  donc toléré par cette vérification) ; le risque réel d'un slash final est la concaténation
  `${base_url}/${auth_endpoint}`, qui produirait une URL à double slash
  (`https://…workers.dev//auth`) et une URL de worker mal formée. Une origine proprement formée
  évite ces ambiguïtés ;
- `auth_endpoint` doit correspondre au chemin exposé par le worker (`auth` par défaut). Le chemin
  complet appelé est `<base_url>/<auth_endpoint>` ;
- `branch: main` doit être la branche où Decap écrit ; c'est aussi la branche qui déclenche le
  workflow de déploiement (voir le README, section « Déploiement GitHub Pages ») ;
- `local_backend: true` reste présent : en local, Decap détecte `decap-server` sur
  `localhost:8081` et bascule sur le backend proxy, **sans OAuth ni `base_url`**. Ne pas retirer
  cette ligne sous prétexte de production : elle est ignorée hors localhost ;
- `auth_scope` (option Decap, valeurs `repo` ou `public_repo`) ne s'applique **qu'avec une OAuth
  App classique** : il limite le scope demandé à GitHub si le dépôt est **public**. Par défaut,
  Decap demande `repo` (accès plus large) ; pour un dépôt public, `public_repo` est plus
  restrictif. **Avec une GitHub App, `auth_scope` n'a aucun effet** : ce sont les permissions de
  l'app (Contents, Pull requests…) qui déterminent les droits accordés.

### 3.5 Cas GitHub Pages

- **Hôte à autoriser** : `ALLOWED_DOMAINS` = `<owner>.github.io` (ou le domaine personnalisé).
  Attention : le chemin de projet (`/skyblog`, `/mon-repo`) ne fait **pas** partie de l'hôte.
- **Callbacks HTTPS** : l'URL du worker est en HTTPS ; les callback URLs GitHub doivent être
  exactement `https://<worker>/callback`.
- **Collaborateurs** : Decap CMS exige que les utilisateurs aient **accès en push** au dépôt
  (voir la doc GitHub backend de Decap) ; un simple droit de lecture ne suffit pas.
- **Organisation avec SSO** : si le dépôt appartient à une organisation protégée, il peut être
  nécessaire d'approuver l'OAuth App / d'autoriser le jeton dans les paramètres SSO de
  l'organisation.

---

## 4. Option B — Decap Turbo (hébergé)

Decap Turbo est un backend hébergé pour Decap CMS : les éditeurs se connectent avec un **compte
Turbo** (plus besoin de compte GitHub pour éditer), et les appels à GitHub/GitLab passent par un
proxy serveur avec cache. Le contenu reste dans votre dépôt Git.

Configuration (dans `public/admin/config.yml`, à la place du backend `github`) :

```yaml
backend:
  name: turbo-github        # ou turbo-gitlab
  turbo_site_id: <uuid-du-site-dans-turbo>   # Overview du site, seule valeur à saisir
  branch: main              # optionnel ; la branche du site est utilisée par défaut
```

À prévoir :

- créer un compte Turbo, une organisation, connecter GitHub, créer un site et relever
  `turbo_site_id` ;
- déclarer les **URL d'administration** du site (origine seulement) dans Turbo, par exemple
  `https://<owner>.github.io` ;
- Turbo lit les collections au **chemin de config** du dépôt : pour ce projet,
  `public/admin/config.yml` (le chemin servi est `/admin/config.yml`) ;
- `local_backend: true` peut rester pour le développement local (le mode local passe par
  `decap-server`, pas par Turbo) ;
- le service est **payant au-delà de l'offre éventuelle** : voir la page tarifs de Decap Turbo ;
- un média library S3-compatible est disponible sur les plans Pro et supérieurs (option).

C'est l'option la plus simple à exploiter, au prix d'une dépendance à un service tiers.

---

## 5. Option C — autres clients OAuth communautaires

Decap maintient une liste de **clients OAuth externes communautaires** (Node.js, Go, Python,
serverless, PHP, Rust, etc.) sur
[decapcms.org/docs/external-oauth-clients/](https://decapcms.org/docs/external-oauth-clients/).
Ils se configurent de la même façon côté Decap (`backend.base_url` + `auth_endpoint`), mais :

- chaque projet a ses propres variables d'environnement, endpoints et procédure de déploiement ;
- la compatibilité et la maintenance varient : auditez le code, épinglez une version, surveillez
  les mises à jour ;
- l'hébergement (et donc la sécurité : HTTPS, secrets, CORS) reste à votre charge.

Pour un petit site, l'option A (worker dédié) reste généralement plus simple à auditer.

---

## 6. Checklist sécurité

À appliquer **avant** la mise en production :

- [ ] **Aucun secret dans le dépôt ni dans le front** : le `client_secret` (et de préférence le
      Client ID) ne vivent que dans les variables du worker. Rechercher régulièrement
      `GITHUB_CLIENT_SECRET`/`client_secret` dans l'historique Git et les fichiers.
- [ ] **Redirect URI exacte** : `<worker>/callback`, sans wildcard, en HTTPS ; toute modification
      de domaine du worker doit être répercutée côté GitHub ET côté `base_url`.
- [ ] **Validation du `state`** : le worker gère le paramètre `state` anti-CSRF (ne pas le
      désactiver ; vérifier ce comportement dans le code/README du worker choisi).
- [ ] **Scope minimal** : GitHub App avec permissions limitées au dépôt (Contents write ; Pull
      requests seulement si workflow éditorial) ; ou, en OAuth App classique, `auth_scope:
      public_repo` si le dépôt est public (`repo` requis pour un dépôt privé — assumer ce
      périmètre). Rappel : **`auth_scope` est sans effet avec une GitHub App**, ce sont les
      permissions de l'app qui s'appliquent.
- [ ] **Expiration et rotation des jetons** : avec une GitHub App, laisser « **Expire user
      authorization tokens** » **coché** (jetons à durée limitée, renouvelés via refresh token par
      le worker). Sans expiration, un jeton volé reste valide jusqu'à révocation. En cas de doute,
      révoquer les autorisations et régénérer les secrets, puis redéployer le worker.
- [ ] **Origines restreintes** : `ALLOWED_DOMAINS` limité à l'hôte (ou aux hôtes) du site ;
      pas de wildcard trop large, pas de `localhost` en production.
- [ ] **Seuls les collaborateurs avec push access** peuvent éditer (exigence du backend GitHub) ;
      retirer les accès des anciens collaborateurs.
- [ ] **Authentification ≠ autorisation** : n'importe quel compte GitHub peut *autoriser* l'app
      OAuth (il n'y a pas de liste d'utilisateurs dans le worker), mais Decap CMS ne peut lire ou
      écrire qu'avec un compte ayant un **accès push au dépôt**. La restriction repose donc sur les
      permissions GitHub du dépôt : vérifier régulièrement les collaborateurs et l'installation de
      l'app (uniquement sur le dépôt du site).
- [ ] **HTTPS partout** : site, worker, callbacks. Aucun callback `http://`.
- [ ] **Rotation des secrets** : en cas de fuite ou périodiquement, régénérer le client secret
      côté GitHub, mettre à jour le secret du worker, redéployer. Révoquer les autorisations
      inutilisées (Settings → Applications → Authorized OAuth Apps / GitHub Apps).
- [ ] **`local_backend` jamais exposé en production** : `decap-server` n'a aucune authentification
      et ne doit pas être accessible sur Internet. Le mode local reste limité à `localhost`.
- [ ] **Traçabilité** : Decap écrit des commits directement sur la branche configurée (`main`) et
      déclenche donc le workflow de déploiement. Surveiller l'activité du dépôt (audit log,
      notifications). Envisager `publish_mode: editorial_workflow` (commits sur des branches de
      PR, revue avant fusion — nécessite les permissions Pull requests) et/ou des règles de
      protection de branche.
- [ ] **`/admin` reste en `noindex`** (déjà le cas : `src/pages/admin/index.astro`) — ce n'est pas
      une mesure de sécurité, l'authentification GitHub reste la seule barrière.
- [ ] **Audit du worker** : vérifier/épingler la version déployée, surveiller ses dépendances
      (`npm audit` dans le projet du worker), ne pas modifier le code sans relire.
- [ ] **CSP (si vous en ajoutez une plus tard)** : Decap CMS utilise des styles inline (Emotion) et,
      selon les versions, une évaluation interne de son schéma de configuration ; tester `/admin`
      avant d'appliquer une CSP stricte.
- [ ] **Ne pas partager le jeton d'accès** : il est stocké dans le navigateur de l'éditeur ; la
      déconnexion de l'admin doit être utilisée sur un poste partagé.

---

## 7. Checklist de test en production

Après avoir renseigné `repo` et `base_url` (et déployé le worker) :

1. [ ] Le site est publié et `https://<site>/admin/` s'affiche (pas d'erreur de config).
2. [ ] Cliquer sur **« Login with GitHub »** : la fenêtre GitHub s'ouvre, l'autorisation est
       demandée, puis retour au CMS connecté.
3. [ ] La collection **Articles** est visible et l'article de démonstration s'ouvre.
4. [ ] Créer un petit article de test, l'enregistrer : un **commit** apparaît sur `main`
       (auteur = compte GitHub de l'éditeur ou app, selon la variante).
5. [ ] Le commit déclenche le workflow **Deploy to GitHub Pages** (onglet Actions) qui se termine
       en succès ; le déploiement publie le nouvel article.
6. [ ] Vérifier le rendu public de l'article puis **supprimer l'article de test** (le commit de
       suppression redéclenche un déploiement).
7. [ ] Se déconnecter de l'admin, puis revérifier qu'une session expirée ne permet plus d'écrire.
8. [ ] **Non-régression locale** : `npm run dev` + `npm run cms` → édition locale sans OAuth
       toujours fonctionnelle (le backend proxy est détecté automatiquement).

---

## 8. Erreurs courantes

| Symptôme | Cause probable | Piste |
| --- | --- | --- |
| `redirect_uri_mismatch` (GitHub) | URL de callback différente de `<worker>/callback` | Corriger la callback URL côté GitHub (chemin exact, HTTPS, même domaine) |
| Popup de login bloquée / ne revient pas | Popup bloquée, `base_url` avec chemin ou slash final, mauvais `auth_endpoint` | Autoriser les popups ; `base_url` = origine seule ; `auth_endpoint: auth` |
| Le worker refuse la demande (CORS/origine) | `ALLOWED_DOMAINS` vide ou ne correspond pas à l'hôte du site | Renseigner l'hôte exact, sans port ni chemin |
| Erreur 404 sur `/admin/config.yml` | Fichier absent du build, ou base path incorrect | Vérifier `public/admin/config.yml` et le build base-aware (voir README, section « Déploiement GitHub Pages ») |
| 403 / « not a collaborator » | Compte GitHub sans accès en push au dépôt | Ajouter le compte comme collaborateur (ou accès équipe) |
| 401 « bad credentials » après rotation | Ancien client secret encore configuré dans le worker | Mettre à jour `GITHUB_CLIENT_SECRET` puis redéployer le worker |
| « Not Found » / dépôt introuvable | `repo` erroné, mauvaise branche, app non installée | Corriger `owner/repo`, `branch`, installer l'app sur le dépôt |
| Login OK mais écriture impossible | Permissions insuffisantes (GitHub App : Contents en lecture seule) | Passer Contents en **Read and write** et réinstaller l'app |

---

## 9. Limitations et risques assumés

- **Médias et base de projet GitHub Pages** : `media_folder: public/images/uploads` et
  `public_folder: /images/uploads` du CMS produisent des chemins **absolus**
  (`/images/uploads/...`). Les pages publiées sont corrigées au rendu par le plugin rehype
  `src/utils/rehype-base-images.mjs` (préfixage avec le `base` du site, à la racine comme sous un
  sous-dossier). Limite résiduelle : les **aperçus d'images dans l'interface d'administration**
  utilisent le chemin absolu et peuvent ne pas s'afficher sous une base de projet.
- **Pas de prévisualisation serveur** : Decap CMS est une interface statique ; la prévisualisation
  intégrée est côté client/site, il n'y a pas de rendu serveur du Markdown.
- **Dépendance d'infrastructure** : le worker OAuth doit être maintenu (mises à jour de sécurité,
  disponibilité Cloudflare, renouvellement de domaine, éventuels changements d'API GitHub).
- **Coût / quotas** : l'offre gratuite Cloudflare Workers a des quotas ; Decap Turbo est payant.
- **Écriture directe sur `main`** : par défaut Decap commite directement sur la branche configurée,
  ce qui déclenche le déploiement ; le workflow éditorial (`publish_mode: editorial_workflow`) ou
  des protections de branche peuvent être ajoutés, avec les permissions GitHub correspondantes
  (Pull requests).
- **Sécurité = celle du worker et de GitHub** : ce document ne garantit pas la sécurité de
  l'infrastructure ; il décrit la configuration attendue et les vérifications à effectuer.
- **Aucune valeur réelle dans ce dépôt** : il n'existe ici ni OAuth App, ni GitHub App, ni worker
  déployé, ni secret. Les placeholders ne permettent pas de se connecter en production tant que
  le propriétaire n'a pas réalisé la procédure.

---

## Références

Sources officielles consultées lors de la rédaction (accès vérifié le 25 novembre 2026) :

- Decap CMS — GitHub backend : https://decapcms.org/docs/github-backend/
  (authentification par un serveur, accès push requis, alternative Decap Turbo)
- Decap CMS — External OAuth Clients : https://decapcms.org/docs/external-oauth-clients/
  (liste des clients OAuth communautaires)
- Decap CMS — Decap Proxy / dépôt local : https://decapcms.org/docs/decap-proxy/
  (`local_backend`, `decap-server`, limites et absence d'authentification du proxy local)
- Decap CMS — Configuration Options : https://decapcms.org/docs/configuration-options/
  (`backend`, `local_backend`, `publish_mode`, `media_folder`/`public_folder`, etc.)
- Decap CMS — Decap Turbo overview : https://decapcms.org/docs/turbo-overview/
  et Connecting a site : https://decapcms.org/docs/turbo-connecting-a-site/
  (backend `turbo-github`, `turbo_site_id`)
- Decap CMS — Editorial Workflows : https://decapcms.org/docs/editorial-workflows/
- Decap Turbo (tarifs / présentation) : https://decapcms.org/turbo/
- Sveltia CMS Authenticator (worker Cloudflare) : https://github.com/sveltia/sveltia-cms-auth
  (déploiement, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS`, callback
  `<worker>/callback`, GitHub App recommandée, OAuth App toujours supportée)
- GitHub Docs — Créer une OAuth App :
  https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
- GitHub Docs — Autoriser des OAuth Apps (scopes, dont `repo`/`public_repo`) :
  https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- GitHub Docs — Enregistrer une GitHub App :
  https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app
- Cloudflare Workers — commandes Wrangler :
  https://developers.cloudflare.com/workers/wrangler/commands/
- Cloudflare Workers — variables d'environnement et secrets :
  https://developers.cloudflare.com/workers/configuration/environment-variables/
