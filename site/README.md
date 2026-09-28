# MEDI-SPA Saly — site premium (Astro + Decap CMS, sans WordPress)

Maquette commerciale + base de production. Voir `STACK.md` (choix techniques) et `GUIDE-GESTION.md` (mode d'emploi équipe).

## Lancer
```bash
cd site
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/ (1,9 Mo, 2 pages FR/EN + admin)
```

## Structure
- `src/pages/index.astro` — page FR complète (hero triptyque, soins, rituels, lieu, avis, FAQ, résa WhatsApp)
- `src/pages/en.astro` — version EN
- `src/data/site.json|soins.json|rituels.json` — tout le contenu éditable (c'est ce que l'admin modifie)
- `src/layouts/Base.astro` — SEO + Schema.org BeautySalon + barre sticky Appeler/WhatsApp
- `public/images/` — 10 visuels premium locaux (à remplacer par vraies photos du spa)
- `public/admin/` — Decap CMS : l'équipe édite tarifs/photos/horaires depuis son téléphone

## Déploiement
Pousser sur GitHub → connecter Cloudflare Pages ou Netlify → domaine medi-spa-saly.sn. Chaque « Publier » dans /admin redéploie en ~1 min. Coût hébergement : 0.
