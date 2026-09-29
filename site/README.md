# MEDI-SPA Saly — site

Site vitrine FR/EN du centre de bien-être MEDI-SPA Saly (Face Totem, Saly Portudal). Il comprend une réservation guidée et une carte cadeau, qui aboutissent toutes deux sur WhatsApp. Aucun serveur ni base de données : le site est statique.

## Lancer

```bash
npm install
npm run dev        # http://localhost:4321
npm test           # tests de la logique (Vitest)
npm run build      # site statique dans dist/
npm run verifier   # contrôle de dist/ : langue, SEO, liens, WhatsApp, règles de texte
```

## Où modifier quoi

| Besoin | Fichier |
|---|---|
| Prix, textes ou photo d'un soin | `src/content/soins/<slug>.json` |
| Rituels | `src/content/rituels/<id>.json` |
| Horaires, téléphone, nocturnes, mode démo | `src/data/site.json` |
| Boutons et libellés FR/EN | `src/i18n/ui.ts` |
| Avis (copie exacte d'avis Google uniquement) | `src/content/avis.json` |
| Photos | déposer dans `photos-sources/`, puis `python3 scripts/photos.py` |
| Logo | `public/logo-medi-spa.svg` (enseigne de la façade, vectorisée) |

Chaque fichier de contenu est validé au build. Un champ manquant, une heure mal écrite ou un numéro WhatsApp avec « + » font échouer le build au lieu de publier une page cassée.

**Nocturnes** : ajouter une entrée dans `nocturnes`, par exemple `{ "debut": "2026-12-18", "fin": "2026-12-19", "heures": ["18:00", "21:00"], "quand": { "fr": "vendredi 18 et samedi 19 décembre", "en": "Friday 18 and Saturday 19 December" } }`. Une bannière s'affiche pour la prochaine nocturne. Côté navigateur, une nocturne passée disparaît et la suivante prend le relais, même sans nouveau build.

## Architecture

- **Astro 7**, sortie statique. Pages FR à la racine et EN sous `/en/`, générées à partir des mêmes données.
- **Contenu** : collections JSON typées (`src/content.config.ts`), un fichier par soin avec le FR et l'EN.
- **Logique** (prix, horaires, créneaux, messages WhatsApp, validation) : fonctions pures dans `src/lib/`, toutes testées.
- **Interactivité** : scripts TypeScript sans framework (`src/scripts/`), limités à la réservation, à la carte cadeau et à la carte Google au clic.
- **Direction artistique** : palette « Eau claire », Young Serif et Hanken Grotesk, sablier de l'affiche des Nocturnes dans le hero. Voir `docs/superpowers/specs/`.

## Passer de la démo à la production

- [ ] `demo: false` dans `src/data/site.json`. Cela retire le bandeau et le `noindex`, et publie les prix dans Schema.org.
- [ ] Vrais tarifs dans les 7 soins et les 3 rituels.
- [ ] Horaires confirmés.
- [ ] `nocturnes` à jour.
- [ ] Descriptions de soins validées par la gérante.
- [ ] Droits photos signés (voir `SOURCES-PHOTOS.md`). Remplacer les photos non validées.
- [ ] Accord pour citer les avis Google.
- [ ] Domaine définitif dans `astro.config.mjs` (`site`).
- [ ] `npm test && npm run build && npm run verifier`.
- [ ] Déploiement (Cloudflare Pages ou Netlify) : pousser le dépôt, commande `npm run build`, dossier `dist`.
