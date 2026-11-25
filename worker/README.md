# Commentaires — Worker Cloudflare (D1 + Turnstile)

Backend des commentaires **anonymes** de Mon Skyblog : un Worker Cloudflare
(ESM), une base D1 et Turnstile en anti-spam. Aucun compte visiteur, aucune
adresse email, publication immédiate. Budget 0 €.

- Worker : `mon-skyblog-comments` (`src/index.js`)
- Base D1 : `mon-skyblog-comments`, région **`eeur`** (Union européenne)
- Migrations : `migrations/`
- Tests : `node --test worker/test` (depuis la racine du dépôt)

Toutes les commandes `wrangler` ci-dessous se lancent depuis **`worker/`**
(le fichier `wrangler.toml` s'y trouve). Aucune dépendance npm n'est installée
dans `worker/` : `npx wrangler@4.168.0` suffit (version épinglée et testée).

## 1. Créer la base D1 en UE

```bash
cd worker
npx wrangler@4.168.0 login       # une seule fois
npx wrangler@4.168.0 d1 create mon-skyblog-comments --location=eeur
```

La commande affiche un `database_id` : le renseigner dans la **variable GitHub**
`D1_DATABASE_ID` (Settings → Secrets and variables → Actions → **Variables**).
C'est un identifiant public, pas un secret.

Le fichier `wrangler.toml` conserve le placeholder
`REMPLACER_PAR_D1_DATABASE_ID` pour le développement local (`wrangler dev`
utilise une D1 locale). En CI, le workflow le remplace automatiquement avant
les migrations et le déploiement. Vérifier la base avec :

```bash
npx wrangler@4.168.0 d1 list
```

Équivalent dashboard : **Storage & Databases → D1 → Create database**, nom
`mon-skyblog-comments`, localisation **Eastern Europe (EEUR)**.

## 2. Créer le widget Turnstile

Dashboard Cloudflare → **Turnstile → Add widget** (gratuit) :

- domaines : `cointroh.github.io` et, pour le développement local, `localhost`
  et `127.0.0.1` ;
- mode : **Invisible** (ou *Non-interactive*) — pas de case à cocher imposée
  aux visiteurs ;
- récupérer la **site key** (publique) et la **secret key** (privée).

La site key est publique : elle ira dans la variable GitHub
`TURNSTILE_SITE_KEY`. La secret key n'est stockée que dans Cloudflare (jamais
dans le dépôt ni dans GitHub Actions).

## 3. Définir les secrets du Worker

Toujours depuis `worker/` :

```bash
npx wrangler@4.168.0 secret put TURNSTILE_SECRET   # coller la secret key Turnstile
npx wrangler@4.168.0 secret put ADMIN_TOKEN        # jeton long, généré localement
```

Générer `ADMIN_TOKEN` avec `openssl rand -hex 32` (64 caractères hexadécimaux).
Ces secrets sont stockés dans Cloudflare, jamais dans le dépôt ni dans GitHub
Actions. Équivalent dashboard : Worker → **Settings → Variables and Secrets**.

## 4. Renseigner les secrets et variables GitHub

Settings → **Secrets and variables → Actions** :

| Type | Nom | Valeur |
| --- | --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` | token API Cloudflare |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | identifiant de compte Cloudflare |
| Variable | `D1_DATABASE_ID` | identifiant de la base D1 (public, injecté en CI) |
| Variable | `COMMENTS_API` | URL du Worker, **sans slash final** |
| Variable | `TURNSTILE_SITE_KEY` | site key publique Turnstile |

Créer le token API : **My Profile → API Tokens → Create Token → Custom token**,
avec les permissions **Workers Scripts:Edit** et **D1:Edit** sur le compte
concerné (aucune permission de zone nécessaire). L'*Account ID* est visible sur
la page d'accueil du dashboard Cloudflare.

> `TURNSTILE_SECRET` et `ADMIN_TOKEN` ne doivent **pas** être créés dans
> GitHub : ils vivent uniquement côté Worker.

## 5. Déployer

GitHub → **Actions → Deploy comments Worker → Run workflow** (branche `main`).
Le workflow injecte d'abord `D1_DATABASE_ID` dans `wrangler.toml`, applique les
migrations D1 (`--remote`), puis déploie le Worker. Le déclenchement est manuel
tant que les ressources ne sont pas créées ; un déclencheur `push` sur
`worker/**` pourra être ajouté ensuite. Le Cron Trigger (`[triggers]` dans
`wrangler.toml`) est déployé avec le Worker : aucune action supplémentaire.

URL de service, de la forme :

```text
https://mon-skyblog-comments.<compte>.workers.dev
```

Vérification rapide :

```bash
curl https://mon-skyblog-comments.<compte>.workers.dev/health
# {"ok":true}
```

Renseigner ensuite la variable GitHub `COMMENTS_API` avec cette URL **sans
slash final**, et `TURNSTILE_SITE_KEY` avec la site key. Relancer le déploiement
du site GitHub Pages pour que le build Astro intègre ces valeurs publiques.

Si le site change de domaine, ajouter l'origine correspondante à
`ALLOWED_ORIGINS` dans `worker/wrangler.toml` puis redéployer le Worker.

## 6. Supprimer un commentaire (admin)

Il n'y a pas de modération a priori ; l'administration se limite à la
suppression. Elle exige `ADMIN_TOKEN` :

```bash
export COMMENTS_API="https://mon-skyblog-comments.<compte>.workers.dev"
read -rsp 'ADMIN_TOKEN : ' ADMIN_TOKEN; echo
curl -i -X DELETE "$COMMENTS_API/comments/42" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

- `204` : commentaire supprimé ;
- `404` : identifiant inconnu ;
- `401` : jeton absent ou incorrect.

Ne pas coller le jeton réel dans un terminal partagé, un historique de commandes
ou un ticket.

## Données et vie privée

- D1 est créée en **UE** (`eeur`). Offre gratuite : 5 Go, 5 M lectures/jour,
  100 k écritures/jour. Workers : 100 k requêtes/jour. Turnstile : gratuit.
- Sont stockés : chemin de page, pseudo, message, date ; rien d'autre. Pas
  d'adresse IP brute, pas d'email, aucun log de message ni d'IP côté Worker.
- Le rate limit ne conserve qu'une empreinte SHA-256 (`ip_hash`), salée par
  jour et par la secret Turnstile. Les empreintes de plus de 24 h sont purgées
  après chaque POST **et** par un **Cron Trigger** horaire (`17 * * * *`), donc
  même sans nouveau commentaire. Les Cron Triggers sont gratuits dans le plan
  Workers Free (5 par compte).
- Les messages sont conservés **jusqu'à leur suppression** par
  l'administrateur. La colonne `hidden` existe pour de futurs besoins mais aucun
  masquage automatique n'est appliqué.
- Les messages sont du texte brut : le frontend les affiche avec `textContent`
  (jamais `innerHTML`).
- Turnstile est le seul service tiers sollicité, uniquement pour l'anti-robot.

## Tests et vérifications

```bash
node --test worker/test             # depuis la racine
node --check worker/src/index.js
node --check worker/src/validate.js
npx --yes wrangler@4.168.0 deploy --dry-run   # depuis worker/ (placeholder accepté)
```

`worker/test/index.js` sert de point d'entrée : depuis Node.js 24,
`node --test <répertoire>` ne développe plus le dossier, il le résout comme un
module.
