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

---

## Révision 1 — 29/09/2026 : direction « Eau claire », logo de la façade et règles de texte

Cette révision **remplace le §3** (direction artistique) et **modifie le contenu de l'accueil (§4)**, après le retour du client : la première version faisait « générique IA », avec Cormorant + Jost, du beige et de l'or, et un texte qui répétait les infos. Parmi deux maquettes rendues (`maquettes/`), le client a choisi la **structure** B (sablier, Young Serif, menu typographique), dans la **couleur « Eau claire »** (`maquettes/b2-eau-claire.html`), avec le **logo de la façade**.

### R1. Direction artistique

**Couleurs — palette « Eau claire »**, choisie par le client parmi trois variantes (`maquettes/b2-eau-claire.html`) en remplacement de l'indigo : une couleur qui détend. Aqua pâle lumineux, texte vert profond, sans accent vif. Contrastes vérifiés.

| Jeton | Valeur | Usage |
|---|---|---|
| `eau` | `#D7EAE6` | Fond signature (en-tête, hero). Texte profond dessus : 9,7 |
| `eau-pale` | `#EEF5F3` | Fonds secondaires (rituels, carte cadeau) |
| `eau-trait` | `#B9D6D0` | Filets sur fond eau |
| `profond` | `#1D3B37` | Texte principal (12,1 sur blanc), boutons, fonds sombres (nocturnes, pied de page) |
| `profond-trait` | `#35524D` | Texte secondaire sur eau (6,8), filets sur fond profond |
| `doux` | `#4E6B66` | Texte secondaire sur blanc (5,8) et sur eau-pâle (5,3) |
| `ecume` | `#CFE0DB` | Texte secondaire sur fond profond (8,9) |
| `brume` | `#E4EEEB` | Filets sur blanc |

**Logo** : l'écriture de l'enseigne de la façade, décalquée depuis la photo frontale. Il comprend « Medi » en capitales géométriques au M évasé, « Spa » en script et le visage dessiné au trait. Il est vectorisé en un seul tracé SVG monochrome (`public/logo-medi-spa.svg`). Il s'affiche via un masque CSS pour prendre la couleur du texte (profond sur fond clair, blanc sur fond profond), et le fichier reste en cache. Remplace le M + lotus de la v1.

**Autres choix**
- **Typographies** : **Young Serif** pour les titres (une seule graisse) et **Hanken Grotesk** pour le texte (400, 500, 600). Les deux sont auto-hébergées (`@fontsource`).
- **Motif** : le sablier de l'affiche, c'est-à-dire deux demi-disques de photo. Il est utilisé **une seule fois**, dans le hero, avec le titre à la taille du sablier. Chaque fiche soin a une seule photo en demi-disque. Aucun autre masque décoratif.
- **Mise en page** : hero centré et symétrique. Les contenus sont alignés à gauche dans une colonne d'environ 900 px. Beaucoup de blanc, alternance de blocs eau claire, de blocs blancs et de deux blocs vert profond (nocturnes, pied de page).
- **Boutons** : en pilule, en minuscules, un verbe et un objet, sans flèche.
- **Mouvement** : aucune apparition au scroll. Seules les actions de l'utilisateur animent quelque chose (ouvrir, sélectionner).

### R2. Règles de texte (valables pour tout le site)

1. **Formes interdites** :
   - un surtitre en capitales au-dessus d'un titre ;
   - des infos enchaînées par des points médians ;
   - une flèche en fin de bouton ;
   - un mot mis en valeur (italique ou couleur) dans un titre ;
   - des rangées d'étoiles ;
   - un gros chiffre avec un petit label.
2. **Une info, un endroit** :
   - la note Google apparaît une fois dans le hero, puis la section avis cite les vrais avis sans répéter le chiffre ;
   - l'adresse apparaît dans la section contact et le pied de page, pas ailleurs.
3. **Horaires en une phrase** : « Du lundi au samedi, de 9 h à 20 h. Le dimanche sur rendez-vous. »
4. **Uniquement des faits vérifiables** : soins, prix, lieu, horaires, avis réels. On supprime les affirmations sur l'hygiène ou l'équipe (« équipe attentive », « c'est d'abord l'hygiène »).
5. **Soins** : une ligne descriptive factuelle, un déroulé concret, des prix. La description longue est ramenée à deux phrases au maximum.
6. **Boutons nommés par l'action** : « Réserver un soin », « Voir les soins et les tarifs », « Commander sur WhatsApp », « Demander les prochaines dates ».

### R3. Accueil révisé (remplace la composition du §4)

1. **Hero eau claire en sablier** : titre « Massages, hammam et kiné à Saly », ligne adresse + horaires, deux boutons, note Google.
2. **Soins** : menu typographique des 7 soins (nom, une ligne, prix « dès … »).
3. **Rituels** : trois forfaits (nom, durée, contenu, prix), sans badge.
4. **Nocturnes** : bande vert profond (le soir), une phrase et un bouton WhatsApp. Les dates n'apparaissent que si une nocturne à venir est saisie.
5. **Avis** : les avis Google recopiés mot pour mot, en grand, avec le prénom et le mois. Un lien vers tous les avis.
6. **Carte cadeau** : une phrase, le visuel de la carte (vert profond et eau) et un bouton.
7. **Contact** : photo réelle de la façade, pour reconnaître le lieu en arrivant. Adresse, horaires en une ligne, téléphone, WhatsApp, e-mail, carte au clic.

**Supprimés** : le bandeau de réassurance, la section « Le lieu » (affirmations invérifiables) et le badge circulaire de note.

### R4. Impact sur le plan

- **Inchangés** : `src/lib/` et ses tests, le modèle de contenu, les routes, les scripts de réservation et de carte cadeau (logique), `verifier-dist.mjs`.
- **À refaire selon R1 à R3** :
  - les jetons et les polices (`global.css`, paquets fontsource) ;
  - les composants visuels (Titre, CarteSoin, sections de l'accueil, fiches, liste, réservation, carte cadeau), en suivant les maquettes plutôt que le code visuel du plan ;
  - `ui.ts` (textes raccourcis) ;
  - les champs `accroche` et `description` des soins (raccourcis).
