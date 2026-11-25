# BACKLOG — Mon Skyblog

> Document vivant de pilotage. La source de vérité du contenu reste le dépôt Git.
> Dernière mise à jour : **25/11/2026** — décisions de cadrage validées par le propriétaire.

## 1. Vision et contraintes

Journal rétro « Skyblog 1990-2000 » statique, édité via Decap CMS, déployé sur GitHub Pages.
L'esthétique old-school est une exigence ; les technologies modernes sont autorisées si elles
restent sobres, gratuites et maintenables.

Contraintes :

- **100 % cloud** : Codespaces, GitHub, services gratuits ; aucune installation locale.
- **GitHub Pages** : pas de serveur classique ; le site reste statique.
- **Decap CMS** : interface d'édition du contenu.
- **Budget 0 €** : free tiers uniquement ; aucun service payant sans décision explicite.
- **RGPD** : minimisation, information, effacement, sous-traitants documentés.
- **Accessibilité** : le style rétro ne justifie aucune régression (contrastes, clavier, WCAG 2.2.2).
- **Traçabilité** : chaque décision est consignée ici.

## 2. Décisions validées (25/11/2026)

| ID | Décision | Justification | Conséquence |
|---|---|---|---|
| **D-01** | Le JavaScript est autorisé pour les fonctionnalités ; le contenu reste lisible sans JS autant que possible. | Le propriétaire privilégie le rendu old-school, pas les technologies. | La promesse « zéro JS public » du README/PLAN est remplacée par « JS minimal et documenté ». |
| **D-02** | Images : couverture **et** images dans le corps via l'éditeur Markdown de Decap. La couverture doit apparaître sur la page article. | Demande explicite ; le support existait à moitié. | Ajout de `coverAlt` / `coverCaption`, affichage de la couverture, styles `.prose img`, aide dans le CMS. |
| **D-03** | Commentaires d'articles et livre d'or : **Giscus rejeté** par le propriétaire (compte GitHub obligatoire pour les visiteurs). Giscus est retiré du site. | Critère produit non négociable : aucun compte GitHub ne doit être exigé. | Commentaires momentanément fermés ; aucune donnée collectée ; solution anonyme à choisir (D-09). |
| **D-04** | Compteur : **GoatCounter** hébergé (gratuit, sans cookie, serveurs UE). | Le plus simple et le plus privacy-friendly ; le propriétaire fait confiance au PO. | Le script de comptage est chargé sur toutes les pages publiques (total site-wide) ; le widget de l'accueil affiche le total. Le chiffre affiché est mis en cache **4 h**. Si l'instantanéité devient exigence, basculer sur Cloudflare Worker + D1 (P2-bis). |
| **D-05** | Galerie : **upload admin uniquement** via Decap, page `/galerie/`. | « J'upload moi-même » ; évite l'upload public et ses abus. | Nouvelle collection `gallery`, page dédiée, masquage accessible des GIFs (WCAG 2.2.2). |
| **D-06** | RGPD : page `/confidentialite/`, règles de modération, contact dédié à créer. | Obligation d'information ; données chez GitHub Pages/GoatCounter. | Le contact email reste une action ouverte ; la page est publiée avec un canal provisoire. |
| **D-07** | Budget 0 € ; free tiers. | Contrainte forte. | Aucun service payant sans validation. |
| **D-08** | Si une solution de commentaires est retenue : pas de modération a priori. | « Quitte à pas mettre de modération (sauf antispam) ». | Publication immédiate ; suppression a posteriori via l'administration de la solution retenue. |
| **D-09** | Commentaires anonymes : **décision en attente**. Options à présenter : Worker Cloudflare + D1 + Turnstile (recommandé), service managé, ou pas de commentaires. | Aucune solution ne doit imposer de compte visiteur. | Ne pas implémenter avant accord explicite du propriétaire. Cusdis est déprécié/archivé (juillet 2026) ; Disqus est écarté (publicité/traçage). |

## 3. Backlog priorisé

| ID | Lot | Priorité | Statut | Responsable | Critères d'acceptation |
|---|---|---|---|---|---|
| **P1-T1** | Images éditoriales : couverture sur la page article, `coverAlt`, `coverCaption`, styles des images Markdown, aide CMS. | P1 | Fait (revue OK) | Développeur + Artiste | `/blog/test/` affiche la couverture ; image inline rendue avec le bon base path ; `alt` présent ; build OK. |
| **P1-T2** | Galerie de GIF admin-only : collection Decap, page `/galerie/`, grille, masquage accessible, état vide. | P1 | Fait (revue OK) | Développeur + Artiste | Upload via `/admin/` visible sur `/galerie/` ; GIFs masquables ; `prefers-reduced-motion` ; responsive ; build OK. |
| **P3-T1** | Commentaires et livre d'or anonymes : **en attente de décision** (D-09). Giscus retiré. | P3 | Bloqué — choix de solution | — | Aucun compte visiteur ; publication sans copier-coller ; gratuit ; modèle de données et anti-spam à spécifier après accord. |
| **P2-T1** | Compteur GoatCounter réel, remplaçant le `1337` factice ; script global site-wide. | P2 | Code prêt — site GoatCounter à configurer | Développeur + Artiste | Chiffre réel ; fallback si non configuré/indisponible ; pas de CLS ; label cache 4 h ; `PUBLIC_GOATCOUNTER_CODE`. |
| **P4-T1** | Page `/confidentialite/` + lien footer + règles de modération. | P4 | Page prête — contact email à créer | Développeur + Artiste | Données, finalités, bases légales, durées, droits, sous-traitants, contact ; lien dans le footer. |
| **P4-T2** | Documentation : README, PLAN, guides GoatCounter, exceptions JS/réseau. | P4 | Fait (à réviser après choix commentaires) | PO + Développeur | Docs alignées sur le comportement réel ; aucune promesse « zéro JS » fausse ; setup reproductible. |
| **P5-T1** | Flux RSS. | P5 | À faire | Développeur | `/rss.xml` valide, `<link rel="alternate">`, aucun JS. |
| **P5-T2** | Blogroll / liens amis. | P5 | À faire | Artiste + Développeur | Page, catégories, liens externes `rel`, cohérence rétro. |
| **P5-T3** | Page « Qui suis-je » / fiche profil. | P5 | À faire | Artiste | Contenu, avatar pixel, accessibilité. |
| **P5-T4** | Archives par année/mois. | P5 | À faire | Développeur | Pages statiques, navigation ; utile à partir de ~10 articles. |
| **P5-T5** | Easter egg 404 / Konami. | P5 | À faire | Artiste | Optionnel, fallback no-JS, pas de régression. |
| **P5-T6** | Lecteur MIDI. | P5 | Bloqué | — | Droits musicaux, autoplay, mute, accessibilité : à ne pas faire sans fichiers libres. |

### P2-bis (option, non engagée)

Compteur **Cloudflare Worker + D1** : incrément instantané, contrôle total, toujours gratuit.
Plus de code et de maintenance (D1, déploiement, rate limit, RGPD). À activer seulement si le cache
4 h de GoatCounter n'est pas acceptable.

## 4. Questions ouvertes / actions humaines

- [ ] **Choisir la solution de commentaires anonymes** (D-09) : Worker Cloudflare + D1 + Turnstile
      recommandé ; ne rien implémenter avant accord.
- [ ] **Créer le site GoatCounter** (code public, ex. `mon-skyblog`), activer « Allow adding
      visitor counts on your website », désactiver les collectes optionnelles (navigateur, écran,
      localisation), puis ajouter la variable de dépôt `GOATCOUNTER_CODE`
      (Settings → Secrets and variables → Actions → Variables).
- [ ] **Créer l'adresse email de contact** pour les demandes RGPD et la renseigner dans
      `src/config/site.ts` (`contactEmail`).
- [ ] Décider si les **URLs externes** de GIF sont autorisées dans la galerie (upload seul pour l'instant).

## 5. Journal des itérations

| Date | Événement |
|---|---|
| 25/11/2026 | Cadrage initial, matrices d'options, validation du backlog. |
| 25/11/2026 | Discussions GitHub activées sur le dépôt (prérequis Giscus). |
| 25/11/2026 | Implémentation P1/P2/P3/P4 (images, galerie, Giscus, GoatCounter, confidentialité). |
| 25/11/2026 | Revue PO : build 10 pages OK ; couverture `/blog/test/` et image inline vérifiées sous `/mon-skyblog` ; carte de galerie temporaire testée puis retirée ; compteur corrigé en script global ; thème Giscus rétro branché. |
| 25/11/2026 | Commit `709e7a9`, push sur `main`, déploiement GitHub Pages **réussi** ; pages `/livre-d-or/`, `/galerie/`, `/confidentialite/` et `/giscus-theme.css` en ligne. |
| 25/11/2026 | **Giscus retiré** : le propriétaire refuse le compte GitHub obligatoire. Commentaires momentanément fermés ; aucune solution de remplacement codée sans accord (D-09). Discussions GitHub désactivées (aucune discussion créée). |

## 6. Règles de travail

- Le PO ne code pas : il spécifie, délègue, relit les fichiers et rend un verdict binaire.
- Revue par référence : inspection du code et build, jamais un simple résumé d'agent.
- Garde-fou : après 3 rejets consécutifs sur une tâche, arrêt et rapport de blocage.
- Aucun secret dans le dépôt : le code GoatCounter est public ; les secrets restent dans les
  services/Actions.
