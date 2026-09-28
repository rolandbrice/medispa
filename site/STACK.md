# STACK — MEDI-SPA Saly : pourquoi PAS WordPress

## Stack retenue (proposée au client)

| Couche | Choix | Pourquoi |
|---|---|---|
| **Site** | **Astro 7 (statique)** | Pages HTML ultra-légères (<100 Ko), chargement <1,5s en 4G à Saly. Pas de base de données à pirater, pas de mise à jour PHP. |
| **Style** | **TailwindCSS 3** | Design premium sur-mesure (pas de thème générique). |
| **Contenus** | **JSON éditable (`src/data/`)** | Tarifs, soins, rituels, horaires = petits fichiers texte. |
| **Admin cliente** | **Decap CMS 3 (`/admin`)** | Interface simple en français : la gérante modifie tarifs/photos/horaires **depuis son téléphone**, comme WhatsApp. Zéro code. |
| **Médias** | **Images locales `/public/images`** | 10 visuels premium déjà intégrés (~1,5 Mo total). À remplacer par vraies photos du spa. |
| **Réservation** | **WhatsApp deep links + formulaire → WhatsApp** | 95% des clientes de Saly réservent via WhatsApp. Chaque soin a son message pré-rempli → tracking. Évolutif vers Calendly/Cal.com temps réel. |
| **Hébergement** | **Cloudflare Pages ou Netlify (gratuit)** | HTTPS auto, CDN mondial, déploiement à chaque modification validée dans l'admin. Coût : 0 FCFA/mois. |
| **Langues** | **FR (`/`) + EN (`/en/`)** | Clientèle touristes FR/EN. |
| **SEO** | **Schema.org BeautySalon + sitemap + meta** | Objectif : « massage Saly », « hammam Saly », « spa Saly ». |

## Pourquoi pas WordPress ?
1. **Maintenance** : WP = mises à jour PHP/plugins chaque mois, piratage fréquent au SN sans infogérant. Ici : rien à mettre à jour côté cliente.
2. **Vitesse** : WP + page builder = 2–4s à Dakar/Saly. Ici : ~1s, crucial pour touristes en 4G et SEO Google.
3. **Coût** : WP = hébergement mutualisé 30–60k FCFA/an + maintenance. Ici : hébergement statique gratuit, maintenance quasi nulle.
4. **Simplicité cliente** : admin WP = 40 menus qui font peur. Admin Decap = 2 rubriques : « Infos » et « Catalogue ».
5. **Sécurité** : pas de base SQL, pas de login WP à brute-forcer. L'admin Decap passe par GitHub/Netlify Identity avec invitation.

## Limites assumées
- Pas de paiement en ligne natif (Phase 2 : lien Wave/Orange Money sur carte cadeau + rituels).
- Pas de calendrier temps réel en Phase 1 (WhatsApp suffit ; Phase 2 : Cal.com自-hosté ou Calendly, ~0–15$/mois).
- L'admin nécessite GitHub + Netlify/Cloudflare au setup (fait par nous, invisible pour la cliente ensuite).

## Commandes
```bash
npm run dev     # prévisualisation locale http://localhost:4321
npm run build   # build statique -> dist/
npm run preview # tester le build
```
