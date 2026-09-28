# Refonte du site MEDI-SPA Saly — design

Date : 28/09/2026 · Statut : en revue

## 1. Intention

**Ce qui a été décidé avec toi**
- Le site est une **démo de prospection qui devient le vrai site livré** après signature.
- Photos : **mix réel + stock choisi**. Les vraies photos publiques du spa (Facebook) sont utilisées quand elles existent, complétées par du stock libre cohérent avec Saly / le Sénégal.
- Tarifs : si on ne trouve pas les vrais, on affiche des **prix indicatifs** réalistes avec une mention « tarifs indicatifs — démo ».
- Approche : **refonte complète sur Astro**.
- **Pas d'admin.** La gérante envoie ses modifications par WhatsApp, et c'est inclus dans le forfait maintenance.
- Dépôt git local créé.

**Hypothèses (à corriger si fausses)**
- Premier public : la gérante, sur tablette ou téléphone, pendant la visite.
- Public final : touristes FR/BE/anglophones et résidentes de Saly, surtout sur mobile en 4G.
- La réservation reste 100 % WhatsApp en phase 1.

## 2. Critères de réussite
1. La gérante reconnaît **sa** marque en 3 secondes : son logo, ses couleurs, sa vraie cabine.
2. **Aucun contenu inventé présenté comme réel.** Les avis sont recopiés mot pour mot ou absents. Les prix inventés portent la mention démo. Les infos non confirmées (horaires, nocturnes) sont listées pour la visite.
3. Rendu impeccable en 390 px, 820 px et 1440 px, vérifié par captures.
4. Lighthouse mobile ≥ 95 en Performance, Accessibilité, Bonnes pratiques et SEO sur l'accueil et une page soin.
5. Une page par soin en FR et en EN, sitemap, `hreflang`, Schema.org valide.
6. `npm run build` et `npm test` passent.
7. Pour passer de la démo à la production : `demo: false` dans `site.json`, plus le remplacement des contenus marqués « à confirmer ».

## 3. Direction artistique

Elle est tirée de la vraie marque, c'est-à-dire de l'affiche des Nocturnes.

**Couleurs** (fond et or relevés sur l'affiche)

| Jeton | Valeur | Usage |
|---|---|---|
| `taupe` | `#D5C4B2` | Fond de marque (identique à l'affiche) |
| `creme` | `#F7F1E8` | Fond principal |
| `or` | `#D8C890` | Or clair du logo, décor sur fond sombre |
| `or-vif` | `#B8964E` | Filets, puces, icônes |
| `or-profond` | `#7A5F1E` | Texte doré sur fond clair (contraste AA) |
| `encre` | `#2A1A10` | Texte et sections sombres (brun de l'affiche) |

**Autres choix**
- **Logo** : M serif + lotus dans un cercle, redessiné en SVG (header, favicon, carte cadeau). Le fichier original sera demandé à la signature.
- **Motif** : arche et sablier (les deux demi-disques de l'affiche), utilisés comme masques de photo et comme séparateurs.
- **Typographies** : **Cormorant Garamond** (italique 400/500 pour les titres, proche du lettrage de l'affiche) et **Jost** pour le texte. Polices auto-hébergées (`@fontsource`), plus de Google Fonts bloquant.
- **Photos** : même étalonnage chaud sur toutes, pour que réel et stock se fondent. Le hero utilise la cabine réelle recadrée depuis l'affiche.
- **Mouvement** : apparitions sobres au scroll, rien de gadget, et `prefers-reduced-motion` respecté.

## 4. Pages

| Route FR | Route EN | Contenu |
|---|---|---|
| `/` | `/en/` | Hero (cabine réelle, logo, 4,8★ Google) · soins phares avec « à partir de » · rituels · aperçu carte cadeau · le lieu (façade + intérieurs) · avis · infos pratiques, horaires, carte |
| `/soins/` | `/en/treatments/` | Carte complète avec prix, filtrable par catégorie |
| `/soins/<slug>/` (7 pages) | `/en/treatments/<slug>/` | Accroche, déroulé, durées et prix, bienfaits, FAQ du soin, réservation, soins liés |
| `/reserver/` | `/en/book/` | Réservation guidée → WhatsApp |
| `/carte-cadeau/` | `/en/gift-card/` | Carte cadeau avec aperçu → WhatsApp |
| `/404` | — | Page d'erreur à la charte |

**Slugs SEO** : `massage-saly`, `soins-visage-corps-saly`, `hammam-gommage-saly`, `epilation-saly`, `kinesitherapie-saly`, `balneo-saly`, `amincissement-saly`.

**Nocturnes** : c'est un **événement daté** dans `site.json` (`debut`, `fin`, créneau, texte FR/EN). Une bannière et une section s'affichent tant que la date de fin n'est pas passée, puis disparaissent. Dans une démo à 100 % statique, « passé » s'évalue à la fois au build et côté client, pour qu'une démo construite il y a 3 semaines se comporte bien. S'il n'y a aucun événement à venir, rien ne s'affiche.

## 5. Fonctionnalités

**Réservation guidée**
Un îlot JS minimal (vanilla, sans framework) propose 4 étapes :
1. le soin ;
2. la durée, avec le prix ;
3. le jour, sur les 14 prochains jours, avec les jours fermés grisés d'après `horaires` ;
4. le créneau (matin / après-midi / soir, filtré par les horaires du jour) et le prénom.

À la fin, un lien `wa.me` s'ouvre avec un message complet dans la langue de la page. Si JS est désactivé, un lien WhatsApp simple reste disponible. Chaque bouton « Réserver » d'une page soin arrive sur `/reserver/?soin=<slug>`, déjà présélectionné.

**Carte cadeau**
On choisit un montant (25k / 50k / 100k / libre) ou un rituel, puis on remplit « De la part de », « Pour » et un message optionnel. L'aperçu de la carte, au logo et au motif arche, se met à jour en direct. À l'envoi, WhatsApp s'ouvre avec la demande complète. La page indique « Paiement Wave, Orange Money ou espèces — le lien de paiement vous est envoyé sur WhatsApp ». Aucun paiement intégré en phase 1.

**Tarifs**
Chaque soin a `tarifs: [{ duree, prix, libelle? }]`. Les listes affichent le prix minimum (« à partir de »). Les pages soin affichent la grille complète. Si `prix` est vide, on affiche « sur devis ».

**Interrupteur `demo`** dans `site.json`
Quand il vaut `true` :
- un bandeau discret « Démo — tarifs indicatifs » s'affiche ;
- `<meta name="robots" content="noindex">` est ajouté ;
- les prix sont exclus du Schema.org.

`robots.txt` ne bloque rien : un blocage empêcherait Google de lire le `noindex`.

**Autres éléments**
- Google Maps chargé au clic (façade Face Totem), sans iframe au chargement.
- Barre fixe Appeler / WhatsApp sur mobile.
- Bouton « Laisser un avis Google ».
- Sélecteur FR/EN qui pointe vers la page équivalente, pas vers l'accueil.

## 6. Modèle de contenu

```
site/src/
  content.config.ts        schémas zod (le build échoue si un champ manque)
  content/
    soins/<id>.json        1 fichier par soin
    rituels/<id>.json
    avis/<id>.json         avis Google recopiés mot pour mot
  data/site.json           coordonnées, horaires par jour, nocturnes, demo, note Google
  assets/photos/           images optimisées par astro:assets
```

**Soin**
- `slug`, `ordre`, `categorie`, `vedette`
- `image`, `imageAlt{fr,en}`
- `titre{fr,en}`, `accroche{fr,en}`, `description{fr,en}`
- `deroule{fr,en}[]`, `bienfaits{fr,en}[]`
- `tarifs[{ duree, prix, libelle{fr,en}? }]`
- `faq[{ q{fr,en}, r{fr,en} }]`
- `seo{ titre{fr,en}, description{fr,en} }`

**Rituel** : `slug`, `nom{fr,en}`, `duree`, `contenu{fr,en}[]`, `prix`, `vedette`.

**Avis** : `auteur` (prénom + initiale), `date`, `note`, `texte`, `langue`, `source: "google"`.

**site.json** : `demo`, `nom`, `telephone`, `whatsapp`, `email`, `instagram`, `facebook`, `adresse{fr,en}`, `geo{lat,lng}`, `horaires{lun..dim: [ouverture, fermeture] | null}`, `horairesAConfirmer`, `note`, `nbAvis`, `ficheGoogle`, `lienAvisGoogle`, `nocturnes[]`.

**Traductions de l'interface** (boutons, libellés) : `src/i18n/fr.ts` et `src/i18n/en.ts`, typés pour qu'une clé manquante fasse échouer le build.

## 7. Technique
- **Astro 7**, sortie statique.
- **Tailwind 4** via `@tailwindcss/vite`, avec les jetons de couleur en `@theme`. On retire `@astrojs/tailwind`, qui est déprécié.
- `astro:assets` `<Picture>` en AVIF/WebP avec `widths` adaptés. Le hero est en `fetchpriority="high"`, le reste en lazy.
- `@astrojs/sitemap` avec les `i18n` FR/EN.
- Schema.org :
  - `DaySpa` sur l'accueil (adresse, géo, horaires issus des données, `aggregateRating`, `sameAs`) ;
  - `Service` + `Offer` sur chaque page soin (sans prix en mode démo) ;
  - `FAQPage` sur les pages soin ;
  - `BreadcrumbList`.
- JS : uniquement des scripts Astro côté client, sans framework UI. La logique pure (construction des messages WhatsApp, jours et créneaux ouverts, visibilité des nocturnes, prix min) est dans `src/lib/`, testée avec Vitest.
- **Suppressions** :
  - `public/admin/` et Decap ;
  - les avis inventés ;
  - les photos hors sujet (salon de coiffure, piscine d'hôtel, plage des Caraïbes, maquillage) ;
  - `src/pages/en.astro` (remplacé par les routes EN générées).

## 8. Photos
1. Recadrer la cabine réelle de l'affiche (demi-disques haut et bas → une image) et la façade.
2. Facebook « Médi-Spa Saly » via Chrome : **2 à 3 tentatives maximum**. Uniquement des photos de lieux, de produits ou de soins sans cliente identifiable. Si ça échoue, on passe au stock.
3. Stock libre (Unsplash / Pexels) choisi soin par soin, avec des modèles africaines, une lumière chaude et des matières naturelles.
4. `SOURCES-PHOTOS.md` : fichier → source (URL) → licence → « à valider à la signature » pour les photos réelles.

**Règle** : aucune photo qui contredit le soin (pas de coiffure pour la balnéo, pas de piscine d'hôtel pour la kiné).

## 9. Livrables annexes à mettre à jour
- `STACK.md` : retirer Decap et l'admin, expliquer la gestion via forfait maintenance.
- `GUIDE-GESTION.md` : réécrit en « comment m'envoyer vos changements » (WhatsApp → mise en ligne sous 24 h) et checklist démo → production.
- `README.md` : commandes et structure.
- `dossier-prospection.md` : ajouter la **liste de questions de visite** (horaires exacts, nocturnes encore actives ?, vrais tarifs, logo en fichier, droits photos, avis à citer).
- `message-approche.txt` : retirer l'argument « vous modifiez depuis votre téléphone », remplacé par « vous m'envoyez un WhatsApp, c'est en ligne dans la journée ».

## 10. Vérification
- `npm test` : Vitest sur `src/lib/`.
- `npm run build` : schémas zod, et zéro page en erreur.
- Captures Playwright de chaque page en FR et en EN, en 390, 820 et 1440 px, avec chargement forcé des images lazy. Relues une par une.
- Lighthouse mobile sur `/` et `/soins/massage-saly/`.
- Liens : tous les `wa.me`, `tel:` et ancres internes vérifiés par un script sur `dist/`.

## 11. Hors périmètre (phase 2)
Paiement en ligne intégré, calendrier temps réel, rappels automatiques J-1, programme fidélité, admin CMS, déploiement. Le déploiement sera préparé mais ne sera fait qu'avec ton accord et ton compte Cloudflare.
