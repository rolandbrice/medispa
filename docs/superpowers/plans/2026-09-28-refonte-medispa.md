# Refonte MEDI-SPA Saly — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Remplacer le one-page actuel par un site FR/EN de 17 pages, à la marque réelle du spa. Il comprend une page par soin, une réservation guidée et une carte cadeau (toutes deux vers WhatsApp), et un interrupteur démo → production.

**Architecture :** Site Astro 7 statique. Le contenu vit dans des collections JSON validées par zod, avec un fichier par soin qui contient le FR et l'EN. Les pages FR et EN sont de fines routes qui rendent un même composant de page avec `lang`. Toute la logique (prix, horaires, messages WhatsApp, validation) est en TypeScript pur dans `src/lib/`, testée avec Vitest. Les îlots interactifs sont des `<script>` Astro en vanilla TS qui importent ces fonctions.

**Tech Stack :** Astro 7.3, Tailwind 4.3 (`@tailwindcss/vite`), `astro:assets`, `@astrojs/sitemap` 3.7, `@fontsource-variable` (Jost, Cormorant Garamond), Vitest 5, zod 4 (via `astro/zod`), Node 25.

**Spec :** `docs/superpowers/specs/2026-09-28-refonte-medispa-design.md`

## Global Constraints

- Tout le code vit dans `site/`, et toutes les commandes se lancent depuis `site/`.
- Français impeccable (accents, `« »`, espaces insécables avant `: ; ! ?` dans les textes affichés). Anglais britannique pour la version EN.
- Aucun avis inventé. Seuls les avis Google recopiés mot pour mot vont dans `src/content/avis.json`. S'il n'y en a aucun, la section avis n'affiche que la note et le lien.
- Prix affichés au format `25 000 FCFA` en FR (U+202F entre les milliers, U+00A0 avant FCFA) et `25,000 FCFA` en EN.
- `site.json` → `demo: true` pendant la prospection. Il déclenche le bandeau « Démo — tarifs indicatifs », `<meta name="robots" content="noindex">` et l'absence de prix dans le Schema.org.
- Couleurs uniquement via les jetons : `creme #F7F1E8`, `taupe #D5C4B2`, `or #D8C890`, `or-vif #B8964E`, `or-profond #7A5F1E`, `brun #5C4A3A`, `encre #2A1A10`.
- Règles de contraste :
  - `or-profond` jamais en texte < 24 px sur `taupe` (contraste 3,55) ni sur `taupe/50` (4,39). Sur ces fonds, le texte est `encre` ou `brun` (`brun`/`taupe` = 4,96).
  - Texte secondaire en `brun` sur `creme` (7,49), pas en opacité.
- Polices auto-hébergées uniquement : Cormorant Garamond Variable (titres, italique) et Jost Variable (texte). Aucun appel à Google Fonts.
- Heure de Saly = UTC (Africa/Dakar, sans heure d'été). Tous les calculs de date se font en UTC.
- Chaque URL interne se termine par `/` (`trailingSlash: 'always'`).
- Ni React, ni Vue, ni jQuery : les îlots JS sont en TypeScript vanilla.
- Aucune photo qui contredit le soin qu'elle illustre, et aucune cliente identifiable sur une photo réelle.
- Rien n'est déployé, et aucun `git push`, sans accord explicite.

**Écarts assumés par rapport à la spec**
- Le sitemap ne regroupe pas les paires FR/EN, parce que les segments diffèrent (`/soins/` vs `/en/treatments/`). Les paires sont déclarées par `<link rel="alternate" hreflang>` dans chaque `<head>`, ce que Google accepte comme source.
- `geo{lat,lng}` n'est pas renseigné : les coordonnées exactes ne sont pas vérifiées. La carte utilise une requête texte et le Schema.org n'a pas de `geo`.
- `nocturnes` est vide dans la démo : les dates de l'affiche datent de décembre dernier. La section « Nocturnes » reste affichée avec un texte général (« demandez les prochaines dates »), et la bannière datée n'apparaît que lorsqu'un événement à venir est saisi.

## Review Focus

1. **Réservation le jour même en fin de journée.** Exemple : un samedi à 18 h 45, fermeture à 20 h. Aucun créneau déjà passé ne doit être proposé ; s'il n'en reste aucun, le jour est grisé. → tests `horaires.test.ts` (Task 3).
2. **Soin sans prix (« sur devis ») ou offert (bilan à 0).** Jamais « 0 FCFA », « à partir de NaN » ni « à partir de Offert », et le message WhatsApp n'affiche pas de prix vide. → tests `prix.test.ts` (Task 2) et `whatsapp.test.ts` (Task 4).
3. **Prénoms et messages avec accents, `&`, emoji ou retours à la ligne** (« Aïssatou », « Fatou & Awa 😊 »). Le texte reçu sur WhatsApp doit être identique à la saisie. → test aller-retour `whatsapp.test.ts` (Task 4).
4. **Montant libre de carte cadeau mal saisi** (« 50 000 », « 50.000 », « 5000 », « abc », vide). Il est soit normalisé, soit refusé avec un message clair, jamais envoyé tel quel. → tests `cadeau.test.ts` (Task 2).
5. **Démo construite il y a des semaines, nocturne passée entre-temps.** La bannière doit disparaître côté navigateur, même sans nouveau build. → tests `nocturnes.test.ts` (Task 3), plus le script client `scripts/nocturnes.ts` (Task 7).
6. **Page EN qui laisse passer du français** (titre de soin, bouton, message WhatsApp). → parité des clés `ui.test.ts` (Task 6) et contrôle `verifier-dist.mjs` (Task 12).

## Structure des fichiers

```
site/
  astro.config.mjs                 Tailwind 4 (vite), sitemap, trailingSlash
  vitest.config.ts
  public/robots.txt  public/favicon.svg
  scripts/verifier-dist.mjs        contrôle des liens, langue, noindex sur dist/
  src/
    styles/global.css              @theme (jetons), polices, reveal, masques arche
    lib/                           logique pure, testée
      i18n.ts        Lang, Texte
      prix.ts        formaterPrix, prixMin, nomTarif
      routes.ts      chemin, autreLangue
      cadeau.ts      validerMontant, MONTANTS_PROPOSES
      horaires.ts    creneauxDisponibles, prochainsJours, formaterJour
      nocturnes.ts   estPassee, nocturnesAVenir
      whatsapp.ts    lienWhatsApp, messageReservation, messageCarteCadeau
      site.ts        schéma zod + objet `site` validé
      schema-org.ts  JSON-LD DaySpa, Service, FAQPage, BreadcrumbList
    i18n/ui.ts                     textes d'interface FR/EN
    data/site.json
    content.config.ts              collections soins, rituels, avis
    content/soins/<slug>.json (7)  content/rituels/<id>.json (3)  content/avis.json
    assets/photos/                 photos traitées (astro:assets)
    layouts/Base.astro             <head>, SEO, hreflang, JSON-LD, header/footer
    components/                    Logo, Header, Footer, BarreMobile, BandeauDemo,
                                   BanniereNocturne, Photo, Titre, BoutonWhatsApp, CarteMaps
    components/accueil/            Hero, SoinsPhares, Rituels, TeaserCadeau, Lieu, Avis, Nocturnes, Infos
    components/pages/              Accueil, ListeSoins, FicheSoin, Reserver, CarteCadeau
    scripts/                       reveal.ts, nocturnes.ts, reservation.ts, carte-cadeau.ts, carte-maps.ts
    pages/                         index, soins/index, soins/[slug], reserver, carte-cadeau, 404
    pages/en/                      index, treatments/index, treatments/[slug], book, gift-card
```

**Supprimés :**
- `tailwind.config.mjs`, `public/admin/`, `public/images/` (les photos passent dans `src/assets/photos/`) ;
- `src/pages/en.astro`, `src/data/soins.json`, `src/data/rituels.json`.

---

### Task 1 : Fondations (Tailwind 4, polices, jetons, nettoyage)

**Files :**
- Modify: `site/package.json`
- Modify: `site/astro.config.mjs`
- Rewrite: `site/src/styles/global.css`
- Rewrite: `site/public/robots.txt`
- Create: `site/public/favicon.svg`
- Delete: `site/tailwind.config.mjs`, `site/public/admin/`

**Interfaces :**
- Produces :
  - classes Tailwind `bg-creme`, `bg-taupe`, `text-or`, `text-or-vif`, `text-or-profond`, `text-brun`, `text-encre`, `font-serif`, `font-sans` ;
  - classes CSS `.reveal` / `.reveal.visible` (actives seulement sous `html.js`), `.arche`, `.arche-inverse`, `.sablier`, `.grain`, `.skip-link`, `.lien-trait`, `.fleche`, `.surtitre`.

- [ ] **Step 1 : Remplacer les dépendances**

```bash
cd site
npm uninstall @astrojs/tailwind tailwindcss
npm install tailwindcss@^4.3.3 @tailwindcss/vite@^4.3.3 @astrojs/sitemap@^3.7.4 @fontsource-variable/jost@^5.3.0 @fontsource-variable/cormorant-garamond@^5.3.0
npm install -D vitest@^5.0.2
```

Puis, dans `package.json`, remplacer le bloc `scripts` par :

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "test": "vitest run",
  "verifier": "node scripts/verifier-dist.mjs"
}
```

Et mettre `"description": "MEDI-SPA Saly — site FR/EN statique (Astro), réservation et carte cadeau via WhatsApp"`.

- [ ] **Step 2 : Réécrire `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://medi-spa-saly.sn',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3 : Supprimer l'ancien admin et la config Tailwind 3**

```bash
rm -rf public/admin tailwind.config.mjs
```

- [ ] **Step 4 : Réécrire `src/styles/global.css`**

```css
@import "tailwindcss";
@import "@fontsource-variable/jost";
@import "@fontsource-variable/cormorant-garamond";
@import "@fontsource-variable/cormorant-garamond/wght-italic.css";

@theme {
  --color-creme: #F7F1E8;
  --color-taupe: #D5C4B2;
  --color-or: #D8C890;
  --color-or-vif: #B8964E;
  --color-or-profond: #7A5F1E;
  --color-brun: #5C4A3A;
  --color-encre: #2A1A10;
  --font-serif: "Cormorant Garamond Variable", Georgia, serif;
  --font-sans: "Jost Variable", system-ui, sans-serif;
  --ease-doux: cubic-bezier(.22, 1, .36, 1);
}

@layer base {
  html { scroll-behavior: smooth; -webkit-tap-highlight-color: transparent; }
  body { @apply bg-creme text-encre font-sans antialiased; text-rendering: optimizeLegibility; }
  h1, h2, h3 { @apply font-serif font-normal; text-wrap: balance; }
  p { text-wrap: pretty; }
  :focus-visible { outline: 3px solid var(--color-or-profond); outline-offset: 3px; border-radius: 2px; }
  .sombre :focus-visible { outline-color: var(--color-or); }
}

/* Petit texte en capitales espacées au-dessus des titres */
.surtitre { @apply text-[11px] uppercase tracking-[.32em] font-medium; }

/* Apparition au scroll, décalage via --d. Sans JS (pas de classe .js), tout reste visible. */
.js .reveal { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-doux), transform .9s var(--ease-doux); transition-delay: var(--d, 0s); }
.js .reveal.visible { opacity: 1; transform: none; }

/* Motifs de la marque : arche (demi-disque en haut) et sablier (affiche des Nocturnes) */
.arche { border-radius: 999px 999px 0 0; }
.arche-inverse { border-radius: 0 0 999px 999px; }
.sablier { clip-path: polygon(0 0, 100% 0, 50% 50%, 100% 100%, 0 100%, 50% 50%); }

/* Grain léger sur les aplats sombres */
.grain { position: relative; isolation: isolate; }
.grain::after {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .09; z-index: -1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Lien avec trait qui se dessine */
.lien-trait { background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat; transition: background-size .4s var(--ease-doux); }
.lien-trait:hover, .lien-trait[aria-current="page"] { background-size: 100% 1px; }

/* Flèche des CTA qui glisse */
.fleche { display: inline-block; transition: transform .3s var(--ease-doux); }
:where(a, button):hover .fleche { transform: translateX(4px); }

.skip-link { position: absolute; left: 1rem; top: -4rem; z-index: 100; @apply bg-encre text-creme px-5 py-3 text-xs uppercase tracking-[.2em]; transition: top .2s ease; }
.skip-link:focus { top: 1rem; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .js .reveal { opacity: 1; transform: none; transition: none; }
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
}
```

- [ ] **Step 5 : Écrire `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://medi-spa-saly.sn/sitemap-index.xml
```

- [ ] **Step 6 : Écrire `public/favicon.svg`** (le M + lotus du logo, simplifié pour 16 px)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="31" fill="#2A1A10"/>
  <circle cx="32" cy="32" r="27" fill="none" stroke="#D8C890" stroke-width="1.5"/>
  <text x="32" y="43" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#D8C890">M</text>
</svg>
```

- [ ] **Step 7 : Vérifier que le build passe et que les polices sont embarquées**

Run: `npm run build && grep -l "Cormorant Garamond Variable" dist/_astro/*.css`
Expected : build « Complete! », puis au moins un fichier CSS listé. Les anciennes pages compilent toujours : leurs classes inconnues sont simplement ignorées.

- [ ] **Step 8 : Commit**

```bash
git add -A && git commit -m "Fondations : Tailwind 4, polices auto-hébergées, jetons de la marque, retrait de Decap"
```

---

### Task 2 : Prix, routes, montant de carte cadeau (TDD)

**Files :**
- Create: `site/vitest.config.ts`
- Create: `site/src/lib/i18n.ts`, `site/src/lib/prix.ts`, `site/src/lib/routes.ts`, `site/src/lib/cadeau.ts`
- Test: `site/src/lib/prix.test.ts`, `site/src/lib/routes.test.ts`, `site/src/lib/cadeau.test.ts`

**Interfaces :**
- Produces :
  - `type Lang = 'fr' | 'en'`, `type Texte = Record<Lang, string>`, `LANGS: Lang[]` ;
  - `type Tarif = { prix: number | null; duree?: string; libelle?: Texte }` ;
  - `formaterPrix(prix: number | null, lang: Lang): string`, `prixMin(tarifs: Tarif[]): number | null`, `nomTarif(t: Tarif, lang: Lang): string`, `aPartirDe(tarifs: Tarif[], lang: Lang): string` ;
  - `type Page = 'accueil' | 'soins' | 'soin' | 'reserver' | 'carte-cadeau'`, `chemin(page: Page, lang: Lang, slug?: string): string`, `autreLangue(lang: Lang): Lang` ;
  - `MONTANT_MIN = 10000`, `MONTANT_MAX = 500000`, `MONTANTS_PROPOSES = [25000, 50000, 100000]` ;
  - `validerMontant(saisie: string): { ok: true; montant: number } | { ok: false; erreur: 'vide' | 'invalide' | 'trop-bas' | 'trop-haut' }`.

- [ ] **Step 1 : Configurer Vitest**

`site/vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
```

`site/src/lib/i18n.ts` :

```ts
export type Lang = 'fr' | 'en';
export type Texte = Record<Lang, string>;
export const LANGS: Lang[] = ['fr', 'en'];
```

- [ ] **Step 2 : Écrire les tests qui échouent**

`site/src/lib/prix.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { aPartirDe, formaterPrix, nomTarif, prixMin } from './prix';

describe('formaterPrix', () => {
  it('formate en français avec espace fine et insécable', () => {
    expect(formaterPrix(25000, 'fr')).toBe('25 000 FCFA');
  });
  it('formate en anglais avec virgule', () => {
    expect(formaterPrix(25000, 'en')).toBe('25,000 FCFA');
  });
  it('affiche Offert / Free pour 0', () => {
    expect(formaterPrix(0, 'fr')).toBe('Offert');
    expect(formaterPrix(0, 'en')).toBe('Free');
  });
  it('affiche Sur devis / On request pour null', () => {
    expect(formaterPrix(null, 'fr')).toBe('Sur devis');
    expect(formaterPrix(null, 'en')).toBe('On request');
  });
});

describe('prixMin', () => {
  it('ignore les tarifs offerts et sur devis', () => {
    expect(prixMin([{ prix: 0 }, { prix: 20000 }, { prix: null }, { prix: 12000 }])).toBe(12000);
  });
  it('renvoie null sans tarif payant', () => {
    expect(prixMin([{ prix: null }])).toBeNull();
    expect(prixMin([{ prix: 0 }])).toBeNull();
    expect(prixMin([])).toBeNull();
  });
});

describe('aPartirDe', () => {
  it('annonce le plus petit prix payant', () => {
    expect(aPartirDe([{ prix: 0 }, { prix: 20000 }, { prix: 180000 }], 'fr')).toBe('à partir de 20\u202f000\u00a0FCFA');
    expect(aPartirDe([{ prix: 12000 }], 'en')).toBe('from 12,000\u00a0FCFA');
  });
  it('dit « Sur devis » quand aucun prix payant n’existe', () => {
    expect(aPartirDe([{ prix: null }], 'fr')).toBe('Sur devis');
    expect(aPartirDe([{ prix: null }], 'en')).toBe('On request');
  });
});

describe('nomTarif', () => {
  it('combine libellé traduit et durée', () => {
    expect(nomTarif({ prix: 1, duree: '60 min', libelle: { fr: 'Duo', en: 'Couple' } }, 'en')).toBe('Couple · 60 min');
  });
  it('se replie sur la durée seule, puis sur le libellé seul', () => {
    expect(nomTarif({ prix: 1, duree: '30 min' }, 'fr')).toBe('30 min');
    expect(nomTarif({ prix: 1, libelle: { fr: 'Sourcils', en: 'Brows' } }, 'fr')).toBe('Sourcils');
  });
});
```

`site/src/lib/routes.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { autreLangue, chemin } from './routes';

describe('chemin', () => {
  it.each([
    ['accueil', 'fr', undefined, '/'],
    ['accueil', 'en', undefined, '/en/'],
    ['soins', 'fr', undefined, '/soins/'],
    ['soins', 'en', undefined, '/en/treatments/'],
    ['soin', 'fr', 'massage-saly', '/soins/massage-saly/'],
    ['soin', 'en', 'massage-saly', '/en/treatments/massage-saly/'],
    ['reserver', 'fr', undefined, '/reserver/'],
    ['reserver', 'en', undefined, '/en/book/'],
    ['carte-cadeau', 'fr', undefined, '/carte-cadeau/'],
    ['carte-cadeau', 'en', undefined, '/en/gift-card/'],
  ] as const)('%s en %s → %s', (page, lang, slug, attendu) => {
    expect(chemin(page, lang, slug)).toBe(attendu);
  });
  it('refuse une page soin sans slug', () => {
    expect(() => chemin('soin', 'fr')).toThrow();
  });
});

describe('autreLangue', () => {
  it('bascule fr ↔ en', () => {
    expect(autreLangue('fr')).toBe('en');
    expect(autreLangue('en')).toBe('fr');
  });
});
```

`site/src/lib/cadeau.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { validerMontant } from './cadeau';

describe('validerMontant', () => {
  it.each(['50000', '50 000', '50 000', '50.000', '50,000', '50 000 FCFA', '50000F', ' 50 000 cfa '])(
    'accepte « %s »',
    (saisie) => {
      expect(validerMontant(saisie)).toEqual({ ok: true, montant: 50000 });
    },
  );
  it('refuse le vide', () => {
    expect(validerMontant('')).toEqual({ ok: false, erreur: 'vide' });
    expect(validerMontant('   ')).toEqual({ ok: false, erreur: 'vide' });
  });
  it('refuse ce qui n’est pas un nombre entier positif', () => {
    expect(validerMontant('abc')).toEqual({ ok: false, erreur: 'invalide' });
    expect(validerMontant('-5000')).toEqual({ ok: false, erreur: 'invalide' });
    expect(validerMontant('25k')).toEqual({ ok: false, erreur: 'invalide' });
  });
  it('borne entre 10 000 et 500 000', () => {
    expect(validerMontant('5000')).toEqual({ ok: false, erreur: 'trop-bas' });
    expect(validerMontant('1 000 000')).toEqual({ ok: false, erreur: 'trop-haut' });
    expect(validerMontant('10000')).toEqual({ ok: true, montant: 10000 });
    expect(validerMontant('500000')).toEqual({ ok: true, montant: 500000 });
  });
});
```

- [ ] **Step 3 : Vérifier qu'ils échouent**

Run: `npm test`
Expected : FAIL, « Failed to resolve import "./prix" » (idem routes et cadeau).

- [ ] **Step 4 : Implémenter**

`site/src/lib/prix.ts` :

```ts
import type { Lang, Texte } from './i18n';

export type Tarif = { prix: number | null; duree?: string; libelle?: Texte };

const LOCALE: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB' };

/** 25000 → « 25 000 FCFA » ; 0 → Offert ; null → Sur devis. */
export function formaterPrix(prix: number | null, lang: Lang): string {
  if (prix === null) return lang === 'fr' ? 'Sur devis' : 'On request';
  if (prix === 0) return lang === 'fr' ? 'Offert' : 'Free';
  return `${new Intl.NumberFormat(LOCALE[lang]).format(prix)} FCFA`;
}

/** Plus petit prix payant, pour les « à partir de ». */
export function prixMin(tarifs: Tarif[]): number | null {
  const payants = tarifs.map((t) => t.prix).filter((p): p is number => p !== null && p > 0);
  return payants.length ? Math.min(...payants) : null;
}

export function nomTarif(t: Tarif, lang: Lang): string {
  if (t.libelle && t.duree) return `${t.libelle[lang]} · ${t.duree}`;
  return t.libelle?.[lang] ?? t.duree ?? '';
}

/** « à partir de 12 000 FCFA » pour les listes ; « Sur devis » si aucun prix payant. */
export function aPartirDe(tarifs: Tarif[], lang: Lang): string {
  const min = prixMin(tarifs);
  if (min === null) return formaterPrix(null, lang);
  return `${lang === 'fr' ? 'à partir de' : 'from'} ${formaterPrix(min, lang)}`;
}
```

`site/src/lib/routes.ts` :

```ts
import type { Lang } from './i18n';

export type Page = 'accueil' | 'soins' | 'soin' | 'reserver' | 'carte-cadeau';

const SEGMENTS: Record<Lang, Record<'soins' | 'reserver' | 'carte-cadeau', string>> = {
  fr: { soins: 'soins', reserver: 'reserver', 'carte-cadeau': 'carte-cadeau' },
  en: { soins: 'treatments', reserver: 'book', 'carte-cadeau': 'gift-card' },
};

export function chemin(page: Page, lang: Lang, slug?: string): string {
  const racine = lang === 'fr' ? '/' : '/en/';
  if (page === 'accueil') return racine;
  if (page === 'soin') {
    if (!slug) throw new Error('chemin("soin") exige un slug');
    return `${racine}${SEGMENTS[lang].soins}/${slug}/`;
  }
  return `${racine}${SEGMENTS[lang][page]}/`;
}

export const autreLangue = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');
```

`site/src/lib/cadeau.ts` :

```ts
export const MONTANT_MIN = 10_000;
export const MONTANT_MAX = 500_000;
export const MONTANTS_PROPOSES = [25_000, 50_000, 100_000];

export type ResultatMontant =
  | { ok: true; montant: number }
  | { ok: false; erreur: 'vide' | 'invalide' | 'trop-bas' | 'trop-haut' };

/** Accepte « 50000 », « 50 000 », « 50.000 », « 50,000 », « 50 000 FCFA », « 50000F ». */
export function validerMontant(saisie: string): ResultatMontant {
  const nettoye = saisie
    .trim()
    .replace(/\s*(f\s*cfa|cfa|f)$/i, '')
    .replace(/[\s  .,]/g, '');
  if (nettoye === '') return { ok: false, erreur: 'vide' };
  if (!/^\d+$/.test(nettoye)) return { ok: false, erreur: 'invalide' };
  const montant = Number(nettoye);
  if (montant < MONTANT_MIN) return { ok: false, erreur: 'trop-bas' };
  if (montant > MONTANT_MAX) return { ok: false, erreur: 'trop-haut' };
  return { ok: true, montant };
}
```

- [ ] **Step 5 : Vérifier qu'ils passent**

Run: `npm test`
Expected : PASS, 3 fichiers de test, 0 échec.

- [ ] **Step 6 : Commit**

```bash
git add -A && git commit -m "Logique : prix FCFA, routes FR/EN, validation du montant carte cadeau"
```

---

### Task 3 : Horaires, créneaux et nocturnes (TDD)

**Files :**
- Create: `site/src/lib/horaires.ts`, `site/src/lib/nocturnes.ts`
- Test: `site/src/lib/horaires.test.ts`, `site/src/lib/nocturnes.test.ts`

**Interfaces :**
- Consumes : `Lang`, `Texte` (Task 2).
- Produces :
  - `type Jour = 'dim' | 'lun' | 'mar' | 'mer' | 'jeu' | 'ven' | 'sam'`, `type Horaires = Record<Jour, [string, string] | null>`, `type Creneau = 'matin' | 'apres-midi' | 'soir'`, `CRENEAUX: Creneau[]` ;
  - `creneauxDisponibles(date: Date, horaires: Horaires, maintenant: Date): Creneau[]` ;
  - `prochainsJours(maintenant: Date, horaires: Horaires, n?: number): { date: Date; iso: string; creneaux: Creneau[] }[]` ;
  - `formaterJour(date: Date, lang: Lang): string` (« samedi 3 octobre » / « Saturday 3 October ») ;
  - `formaterJourCourt(date: Date, lang: Lang): { jour: string; num: string; mois: string }` ;
  - `formaterPlage(plage: [string, string], lang: Lang): string` (« 9 h – 20 h » / « 9 am – 8 pm ») ;
  - `formaterMois(aaaaMm: string, lang: Lang): string` (« août 2026 » / « August 2026 ») ;
  - `type Nocturne = { debut: string; fin: string; heures: string; quand: Texte; titre: Texte; texte: Texte }` ;
  - `estPassee(fin: string, maintenant: Date): boolean`, `nocturnesAVenir(liste: Nocturne[], maintenant: Date): Nocturne[]`.

Repères de calendrier : le 28/09/2026 est un lundi, le 03/10/2026 un samedi, le 04/10/2026 un dimanche.

- [ ] **Step 1 : Écrire les tests qui échouent**

`site/src/lib/horaires.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { creneauxDisponibles, formaterJour, formaterJourCourt, formaterMois, formaterPlage, prochainsJours, type Horaires } from './horaires';

const H: Horaires = {
  lun: ['09:00', '20:00'], mar: ['09:00', '20:00'], mer: ['09:00', '20:00'],
  jeu: ['09:00', '20:00'], ven: ['09:00', '20:00'], sam: ['09:00', '20:00'], dim: null,
};
const utc = (iso: string) => new Date(iso + 'Z');

describe('creneauxDisponibles', () => {
  it('propose les trois créneaux un jour ouvert à venir', () => {
    expect(creneauxDisponibles(utc('2026-10-03T00:00:00'), H, utc('2026-09-28T10:00:00'))).toEqual(['matin', 'apres-midi', 'soir']);
  });
  it('ne propose rien le dimanche fermé', () => {
    expect(creneauxDisponibles(utc('2026-10-04T00:00:00'), H, utc('2026-09-28T10:00:00'))).toEqual([]);
  });
  it('ne propose rien pour un jour passé', () => {
    expect(creneauxDisponibles(utc('2026-09-27T00:00:00'), H, utc('2026-09-28T10:00:00'))).toEqual([]);
  });
  it('le jour même à 10 h, garde matin (90 min restantes) et la suite', () => {
    expect(creneauxDisponibles(utc('2026-10-03T00:00:00'), H, utc('2026-10-03T10:00:00'))).toEqual(['matin', 'apres-midi', 'soir']);
  });
  it('le jour même à 11 h, retire le matin (moins de 60 min après préavis)', () => {
    expect(creneauxDisponibles(utc('2026-10-03T00:00:00'), H, utc('2026-10-03T11:00:00'))).toEqual(['apres-midi', 'soir']);
  });
  it('le samedi à 18 h 30, il reste la soirée (19 h – 20 h)', () => {
    expect(creneauxDisponibles(utc('2026-10-03T00:00:00'), H, utc('2026-10-03T18:30:00'))).toEqual(['soir']);
  });
  it('le samedi à 18 h 45, plus rien : le jour doit être grisé', () => {
    expect(creneauxDisponibles(utc('2026-10-03T00:00:00'), H, utc('2026-10-03T18:45:00'))).toEqual([]);
  });
  it('ignore l’heure de la date demandée (seul le jour compte)', () => {
    expect(creneauxDisponibles(utc('2026-10-03T23:59:00'), H, utc('2026-09-28T10:00:00'))).toEqual(['matin', 'apres-midi', 'soir']);
  });
});

describe('prochainsJours', () => {
  it('renvoie 14 jours à partir d’aujourd’hui, dimanche sans créneau', () => {
    const jours = prochainsJours(utc('2026-09-28T10:00:00'), H);
    expect(jours).toHaveLength(14);
    expect(jours[0].iso).toBe('2026-09-28');
    expect(jours[6].iso).toBe('2026-10-04');
    expect(jours[6].creneaux).toEqual([]);
    expect(jours[13].iso).toBe('2026-10-11');
  });
});

describe('formaterPlage', () => {
  it('écrit les heures à la française', () => {
    expect(formaterPlage(['09:00', '20:00'], 'fr')).toBe('9 h – 20 h');
    expect(formaterPlage(['09:30', '12:00'], 'fr')).toBe('9 h 30 – 12 h');
  });
  it('écrit les heures à l’anglaise', () => {
    expect(formaterPlage(['09:00', '20:00'], 'en')).toBe('9 am – 8 pm');
    expect(formaterPlage(['09:30', '12:00'], 'en')).toBe('9:30 am – 12 pm');
  });
});

describe('formaterMois', () => {
  it('date un avis au mois près', () => {
    expect(formaterMois('2026-08', 'fr')).toBe('août 2026');
    expect(formaterMois('2026-08', 'en')).toBe('August 2026');
  });
});

describe('formaterJour', () => {
  it('écrit le jour en toutes lettres, heure de Saly', () => {
    expect(formaterJour(utc('2026-10-03T00:00:00'), 'fr')).toBe('samedi 3 octobre');
    expect(formaterJour(utc('2026-10-03T00:00:00'), 'en')).toBe('Saturday 3 October');
  });
  it('fournit une forme courte pour les pastilles du calendrier', () => {
    expect(formaterJourCourt(utc('2026-10-03T00:00:00'), 'fr')).toEqual({ jour: 'sam.', num: '3', mois: 'oct.' });
    expect(formaterJourCourt(utc('2026-10-03T00:00:00'), 'en')).toEqual({ jour: 'Sat', num: '3', mois: 'Oct' });
  });
});
```

`site/src/lib/nocturnes.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { estPassee, nocturnesAVenir, type Nocturne } from './nocturnes';

const t = { fr: 'x', en: 'x' };
const n = (debut: string, fin: string): Nocturne => ({ debut, fin, heures: '18h–21h', quand: t, titre: t, texte: t });
const midi = (jour: string) => new Date(jour + 'T12:00:00Z');

describe('estPassee', () => {
  it('le dernier jour de l’événement n’est pas encore passé', () => {
    expect(estPassee('2026-12-20', midi('2026-12-20'))).toBe(false);
  });
  it('le lendemain, il est passé', () => {
    expect(estPassee('2026-12-20', midi('2026-12-21'))).toBe(true);
  });
});

describe('nocturnesAVenir', () => {
  it('écarte les passées et trie par date de début', () => {
    const liste = [n('2026-12-26', '2026-12-27'), n('2025-12-19', '2025-12-20'), n('2026-12-19', '2026-12-20')];
    expect(nocturnesAVenir(liste, midi('2026-09-28')).map((x) => x.debut)).toEqual(['2026-12-19', '2026-12-26']);
  });
  it('renvoie une liste vide si tout est passé', () => {
    expect(nocturnesAVenir([n('2025-12-19', '2025-12-20')], midi('2026-09-28'))).toEqual([]);
  });
});
```

- [ ] **Step 2 : Vérifier qu'ils échouent**

Run: `npm test`
Expected : FAIL sur `horaires.test.ts` et `nocturnes.test.ts` (import introuvable). Les tests de la Task 2 restent au vert.

- [ ] **Step 3 : Implémenter**

`site/src/lib/horaires.ts` :

```ts
import type { Lang } from './i18n';

export type Jour = 'dim' | 'lun' | 'mar' | 'mer' | 'jeu' | 'ven' | 'sam';
export type Horaires = Record<Jour, [string, string] | null>;
export type Creneau = 'matin' | 'apres-midi' | 'soir';

// Saly vit à l'heure GMT toute l'année (Africa/Dakar = UTC+0) : on calcule en UTC.
const JOURS: Jour[] = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
export const CRENEAUX: Creneau[] = ['matin', 'apres-midi', 'soir'];
const PLAGES: Record<Creneau, [number, number]> = { matin: [0, 720], 'apres-midi': [720, 1020], soir: [1020, 1440] };
const DUREE_MIN = 60; // un soin doit tenir dans le créneau
const PREAVIS = 30; // délai minimum le jour même
const JOUR_MS = 86_400_000;
const LOCALE: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB' };

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const debutDuJour = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

export function creneauxDisponibles(date: Date, horaires: Horaires, maintenant: Date): Creneau[] {
  const plage = horaires[JOURS[date.getUTCDay()]];
  const jour = debutDuJour(date);
  const aujourdhui = debutDuJour(maintenant);
  if (!plage || jour < aujourdhui) return [];
  const [ouverture, fermeture] = plage.map(minutes);
  const plancher = jour === aujourdhui ? maintenant.getUTCHours() * 60 + maintenant.getUTCMinutes() + PREAVIS : 0;
  return CRENEAUX.filter((c) => {
    const debut = Math.max(PLAGES[c][0], ouverture, plancher);
    const fin = Math.min(PLAGES[c][1], fermeture);
    return fin - debut >= DUREE_MIN;
  });
}

export function prochainsJours(maintenant: Date, horaires: Horaires, n = 14) {
  const jour0 = debutDuJour(maintenant);
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(jour0 + i * JOUR_MS);
    return { date, iso: date.toISOString().slice(0, 10), creneaux: creneauxDisponibles(date, horaires, maintenant) };
  });
}

export function formaterJour(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
}

export function formaterJourCourt(date: Date, lang: Lang) {
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(LOCALE[lang], { ...o, timeZone: 'UTC' }).format(date);
  return { jour: f({ weekday: 'short' }), num: f({ day: 'numeric' }), mois: f({ month: 'short' }) };
}

function formaterHeure(hhmm: string, lang: Lang): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (lang === 'fr') return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  const h12 = h % 12 || 12;
  const suffixe = h < 12 ? 'am' : 'pm';
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffixe}` : `${h12} ${suffixe}`;
}

export const formaterPlage = ([ouverture, fermeture]: [string, string], lang: Lang) =>
  `${formaterHeure(ouverture, lang)} – ${formaterHeure(fermeture, lang)}`;

export const formaterMois = (aaaaMm: string, lang: Lang) =>
  new Intl.DateTimeFormat(LOCALE[lang], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${aaaaMm}-01T00:00:00Z`));
```

`site/src/lib/nocturnes.ts` :

```ts
import type { Texte } from './i18n';

export type Nocturne = { debut: string; fin: string; heures: string; quand: Texte; titre: Texte; texte: Texte };

/** Vrai quand la dernière soirée (« AAAA-MM-JJ ») est terminée, au jour près, heure de Saly (UTC). */
export function estPassee(fin: string, maintenant: Date): boolean {
  return fin < maintenant.toISOString().slice(0, 10);
}

export function nocturnesAVenir(liste: Nocturne[], maintenant: Date): Nocturne[] {
  return liste.filter((n) => !estPassee(n.fin, maintenant)).sort((a, b) => a.debut.localeCompare(b.debut));
}
```

- [ ] **Step 4 : Vérifier qu'ils passent**

Run: `npm test`
Expected : PASS, 5 fichiers de test. Si les formes courtes `formaterJourCourt` diffèrent selon la version d'ICU de Node (par exemple `sam.` vs `sam`), aligner l'attendu du test sur la sortie réelle de `node -e` et le noter dans le commit. L'affichage n'en dépend pas.

- [ ] **Step 5 : Commit**

```bash
git add -A && git commit -m "Logique : créneaux de réservation selon les horaires, visibilité des nocturnes"
```

---

### Task 4 : Messages WhatsApp (TDD)

**Files :**
- Create: `site/src/lib/whatsapp.ts`
- Test: `site/src/lib/whatsapp.test.ts`

**Interfaces :**
- Consumes : `Lang` (Task 2), `Creneau`, `formaterJour` (Task 3).
- Produces :
  - `lienWhatsApp(numero: string, message: string): string` ;
  - `type DemandeReservation = { soin: string; formule?: string; prix?: string; jour: Date; creneau: Creneau; prenom: string }` ;
  - `messageReservation(d: DemandeReservation, lang: Lang): string` ;
  - `type DemandeCadeau = { offre: string; de: string; pour: string; mot?: string }` ;
  - `messageCarteCadeau(d: DemandeCadeau, lang: Lang): string` ;
  - `messageInfo(sujet: string | undefined, lang: Lang): string`.

- [ ] **Step 1 : Écrire les tests qui échouent**

`site/src/lib/whatsapp.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { lienWhatsApp, messageCarteCadeau, messageInfo, messageReservation } from './whatsapp';

const texteDe = (url: string) => new URL(url).searchParams.get('text');
const samedi = new Date('2026-10-03T00:00:00Z');

describe('lienWhatsApp', () => {
  it('ne garde que les chiffres du numéro', () => {
    expect(lienWhatsApp('+221 78 595 15 15', 'x').startsWith('https://wa.me/221785951515?text=')).toBe(true);
  });
  it('transmet accents, &, emoji et retours à la ligne sans perte', () => {
    const message = 'Aïssatou & Awa 😊\nligne 2 : « merci » #1 ?';
    expect(texteDe(lienWhatsApp('221785951515', message))).toBe(message);
  });
});

describe('messageReservation', () => {
  it('rédige une demande complète en français', () => {
    const m = messageReservation(
      { soin: 'Massage', formule: '60 min', prix: '20 000 FCFA', jour: samedi, creneau: 'apres-midi', prenom: '  Awa ' },
      'fr',
    );
    expect(m).toBe(
      "Bonjour MEDI-SPA Saly,\nJe souhaite réserver : Massage — 60 min (20 000 FCFA)\nQuand : samedi 3 octobre, l'après-midi\nPrénom : Awa\nMerci de me confirmer l'horaire.",
    );
  });
  it('omet formule et prix quand ils manquent (soin sur devis)', () => {
    const m = messageReservation({ soin: 'Kinésithérapie', jour: samedi, creneau: 'matin', prenom: 'Fatou' }, 'fr');
    expect(m).toContain('Je souhaite réserver : Kinésithérapie\n');
    expect(m).not.toContain('()');
    expect(m).not.toContain('undefined');
  });
  it('rédige en anglais sur la version EN', () => {
    const m = messageReservation({ soin: 'Massage', formule: '60 min', jour: samedi, creneau: 'soir', prenom: 'Emma' }, 'en');
    expect(m).toBe('Hello MEDI-SPA Saly,\nI would like to book: Massage — 60 min\nWhen: Saturday 3 October, in the evening\nName: Emma\nPlease confirm the time.');
  });
});

describe('messageCarteCadeau', () => {
  it('inclut le mot quand il est fourni', () => {
    const m = messageCarteCadeau({ offre: '50 000 FCFA', de: 'Awa', pour: 'Maman', mot: ' Joyeux anniversaire ! ' }, 'fr');
    expect(m).toBe(
      'Bonjour MEDI-SPA Saly,\nJe souhaite offrir une carte cadeau : 50 000 FCFA\nDe la part de : Awa\nPour : Maman\nMessage : « Joyeux anniversaire ! »\nComment puis-je régler (Wave, Orange Money, espèces) ?',
    );
  });
  it('n’ajoute pas de ligne Message quand le mot est vide', () => {
    expect(messageCarteCadeau({ offre: 'Teranga Glow', de: 'A', pour: 'B', mot: '   ' }, 'en')).not.toContain('Message');
  });
});

describe('messageInfo', () => {
  it('cite le sujet quand il existe', () => {
    expect(messageInfo('Hammam & gommage', 'fr')).toBe('Bonjour MEDI-SPA Saly, je souhaite des informations sur : Hammam & gommage.');
    expect(messageInfo(undefined, 'en')).toBe('Hello MEDI-SPA Saly, I would like some information.');
  });
});
```

- [ ] **Step 2 : Vérifier qu'ils échouent**

Run: `npm test`
Expected : FAIL sur `whatsapp.test.ts` (import introuvable).

- [ ] **Step 3 : Implémenter `site/src/lib/whatsapp.ts`**

```ts
import type { Lang } from './i18n';
import { formaterJour, type Creneau } from './horaires';

export function lienWhatsApp(numero: string, message: string): string {
  return `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

const MOMENTS: Record<Lang, Record<Creneau, string>> = {
  fr: { matin: 'le matin', 'apres-midi': "l'après-midi", soir: 'en soirée' },
  en: { matin: 'in the morning', 'apres-midi': 'in the afternoon', soir: 'in the evening' },
};

export type DemandeReservation = { soin: string; formule?: string; prix?: string; jour: Date; creneau: Creneau; prenom: string };

export function messageReservation(d: DemandeReservation, lang: Lang): string {
  const formule = [d.formule, d.prix && `(${d.prix})`].filter(Boolean).join(' ');
  const soin = formule ? `${d.soin} — ${formule}` : d.soin;
  const quand = `${formaterJour(d.jour, lang)}, ${MOMENTS[lang][d.creneau]}`;
  const prenom = d.prenom.trim();
  return lang === 'fr'
    ? `Bonjour MEDI-SPA Saly,\nJe souhaite réserver : ${soin}\nQuand : ${quand}\nPrénom : ${prenom}\nMerci de me confirmer l'horaire.`
    : `Hello MEDI-SPA Saly,\nI would like to book: ${soin}\nWhen: ${quand}\nName: ${prenom}\nPlease confirm the time.`;
}

export type DemandeCadeau = { offre: string; de: string; pour: string; mot?: string };

export function messageCarteCadeau(d: DemandeCadeau, lang: Lang): string {
  const mot = d.mot?.trim();
  const lignes =
    lang === 'fr'
      ? ['Bonjour MEDI-SPA Saly,', `Je souhaite offrir une carte cadeau : ${d.offre}`, `De la part de : ${d.de.trim()}`, `Pour : ${d.pour.trim()}`, mot && `Message : « ${mot} »`, 'Comment puis-je régler (Wave, Orange Money, espèces) ?']
      : ['Hello MEDI-SPA Saly,', `I would like to offer a gift card: ${d.offre}`, `From: ${d.de.trim()}`, `To: ${d.pour.trim()}`, mot && `Message: "${mot}"`, 'How can I pay (Wave, Orange Money, cash)?'];
  return lignes.filter(Boolean).join('\n');
}

export function messageInfo(sujet: string | undefined, lang: Lang): string {
  if (lang === 'fr') return sujet ? `Bonjour MEDI-SPA Saly, je souhaite des informations sur : ${sujet}.` : 'Bonjour MEDI-SPA Saly, je souhaite des informations.';
  return sujet ? `Hello MEDI-SPA Saly, I would like some information about: ${sujet}.` : 'Hello MEDI-SPA Saly, I would like some information.';
}
```

- [ ] **Step 4 : Vérifier qu'ils passent**

Run: `npm test`
Expected : PASS, 6 fichiers de test.

- [ ] **Step 5 : Commit**

```bash
git add -A && git commit -m "Logique : messages WhatsApp de réservation, carte cadeau et demande d'info"
```

---

> **Convention à partir d'ici :** chaque bloc de code précédé d'un marqueur `<!-- fichier: chemin -->` est le contenu **complet** du fichier. Il peut être extrait tel quel avec `python3 scripts/extraire.py <chemin>` (Task 5, Step 0).

### Task 5 : Photos (réelles + stock choisi) et traçabilité des droits

**Files :**
- Create: `scripts/extraire.py` (racine du dépôt : extrait un fichier du plan)
- Create: `site/scripts/photos.py` (recadrage + étalonnage chaud, rejouable)
- Create: `site/src/assets/photos/*.jpg`
- Create: `site/SOURCES-PHOTOS.md`
- Delete: `site/public/images/` (après copie des 2 visuels réels dans `site/photos-sources/`)

**Interfaces :**
- Produces, dans `site/src/assets/photos/` (JPEG, côté long ≥ 1600 px sauf `cabine-arche.jpg`) :
  - `hero.jpg`, `massage.jpg`, `visage.jpg`, `hammam.jpg`, `epilation.jpg`, `kine.jpg`, `balneo.jpg`, `amincissement.jpg` ;
  - `cadeau.jpg`, `ambiance-1.jpg`, `ambiance-2.jpg` ;
  - `facade.jpg` ;
  - `cabine-haut.jpg` (738 × 330) et `cabine-arche.jpg` (740 × 347) : les deux moitiés du sablier de l'affiche, soit la vraie cabine. Elles s'affichent avec `.arche-inverse` et `.arche`, l'une au-dessus de l'autre, pour recomposer le motif de la marque.
  - **L'affiche elle-même n'est pas publiée** : elle porte des dates de décembre dernier qui induiraient en erreur.

- [ ] **Step 0 : Outil d'extraction des fichiers du plan**

<!-- fichier: scripts/extraire.py -->
```python
"""Extrait du plan le contenu d'un fichier annoncé par <!-- fichier: chemin -->.

Usage : python3 scripts/extraire.py site/src/lib/site.ts [autre/chemin ...]
Une variante temporaire se désigne par un suffixe : site/src/pages/index.astro#stub-task6
(le fichier écrit est alors site/src/pages/index.astro).
"""
import pathlib, re, sys

PLAN = pathlib.Path(__file__).resolve().parent.parent / 'docs/superpowers/plans/2026-09-28-refonte-medispa.md'
texte = PLAN.read_text(encoding='utf-8')
motif = re.compile(r'<!-- fichier: (\S+) -->\n```[a-z]*\n(.*?)\n```\n', re.S)
blocs = {m.group(1): m.group(2) + '\n' for m in motif.finditer(texte)}

for chemin in sys.argv[1:]:
    if chemin not in blocs:
        sys.exit(f'Introuvable dans le plan : {chemin}')
    cible = PLAN.parent.parent.parent.parent / chemin.split('#')[0]
    cible.parent.mkdir(parents=True, exist_ok=True)
    cible.write_text(blocs[chemin], encoding='utf-8')
    print('écrit', chemin)
```

- [ ] **Step 1 : Mettre les visuels réels de côté**

```bash
mkdir -p photos-sources src/assets/photos
cp public/images/reelles/facade.jpg public/images/reelles/affiche-nocturnes.jpg photos-sources/
```

- [ ] **Step 2 : Chercher des photos réelles sur Facebook (2 à 3 tentatives maximum)**

Avec Chrome (outils `claude-in-chrome`) : ouvrir la page Facebook « Médi-Spa Saly », onglet Photos.
- **À garder** : cabines, hammam, balnéo, accueil, produits, équipe de dos ou en situation, sans cliente identifiable.
- **Enregistrement** : dans `photos-sources/fb-<sujet>.jpg`, en notant l'URL de chaque photo.
- **Au passage** : noter l'URL exacte de la page Facebook (pour `site.json` → `facebook`), puis ouvrir la fiche Google Maps « MEDI-SPA Saly ».
  - Sur Maps, recopier **mot pour mot** jusqu'à 6 avis récents de 5★, avec prénom + initiale, mois et année.
  - Relever aussi le lien de la fiche.
- **Arrêt** : si Facebook ou Maps demandent une connexion, ou si 3 tentatives échouent, on arrête et on passe au Step 3. On le note dans `SOURCES-PHOTOS.md`.

- [ ] **Step 3 : Compléter avec du stock Unsplash (licence Unsplash : usage commercial libre, sans attribution obligatoire)**

**Requêtes**, en excluant les résultats `premium: true` (Unsplash+) :

```bash
curl -s "https://unsplash.com/napi/search/photos?query=<requête>&per_page=30&orientation=landscape" \
  | python3 -c "import sys,json; [print(r['id'], r['width'], r['premium'], (r['alt_description'] or '')[:80]) for r in json.load(sys.stdin)['results'] if not r['premium']]"
```

| Fichier | Requêtes à essayer |
|---|---|
| `hero.jpg` | `black woman spa massage`, `african woman relaxing spa` |
| `massage.jpg` | `african massage therapist`, `black woman back massage` |
| `visage.jpg` | `black woman facial treatment`, `african skincare facial` |
| `hammam.jpg` | `hammam steam`, `moroccan hammam`, `black soap scrub` |
| `epilation.jpg` | `waxing salon`, `beauty salon black woman` |
| `kine.jpg` | `physiotherapy session`, `physiotherapist massage leg` |
| `balneo.jpg` | `spa jacuzzi`, `whirlpool spa bath` |
| `amincissement.jpg` | `body treatment spa`, `lymphatic drainage` |
| `cadeau.jpg` | `gift card spa`, `spa gift towels flowers` |
| `ambiance-1.jpg`, `ambiance-2.jpg` | `spa towels candles warm`, `massage oil bottles`, `tropical plants spa` |

**Critères de choix** :
- lumière chaude, matières naturelles ;
- modèles noires ou métisses quand il y a une personne ;
- **le sujet correspond exactement au soin** ;
- pas de piscine d'hôtel, de plage ni de salon de coiffure ;
- pas de texte ni de logo dans l'image.

**Téléchargement** d'une photo retenue :

```bash
curl -sL "https://unsplash.com/photos/<id>/download?force=true" -o photos-sources/<fichier>
```

Relire chaque photo retenue avec l'outil Read avant de la garder.

- [ ] **Step 4 : Script de traitement (recadrage + étalonnage chaud identique)**

<!-- fichier: site/scripts/photos.py -->
```python
"""Prépare les photos du site depuis photos-sources/ vers src/assets/photos/.

Étalonnage commun : léger voile chaud + saturation adoucie, pour que photos réelles
et photos de stock forment une seule famille. Rejouable à volonté.
"""
from pathlib import Path
from PIL import Image, ImageEnhance

SRC, DST = Path('photos-sources'), Path('src/assets/photos')
DST.mkdir(parents=True, exist_ok=True)
TAUPE = (213, 196, 178)
COTE_MAX = 2000


def etalonner(im: Image.Image) -> Image.Image:
    im = im.convert('RGB')
    im = ImageEnhance.Color(im).enhance(0.88)
    im = Image.blend(im, Image.new('RGB', im.size, TAUPE), 0.07)
    return ImageEnhance.Contrast(im).enhance(1.03)


def reduire(im: Image.Image) -> Image.Image:
    im.thumbnail((COTE_MAX, COTE_MAX), Image.LANCZOS)
    return im


def sauver(im: Image.Image, nom: str) -> None:
    im.save(DST / nom, quality=88, optimize=True, progressive=True)
    print(f'{nom:24} {im.size[0]}×{im.size[1]}')


# Vraie cabine : les deux moitiés du sablier de l'affiche (zones mesurées sur l'original 2048×1448).
# Les coins couleur taupe restent hors champ une fois masqués par .arche-inverse / .arche.
affiche = Image.open(SRC / 'affiche-nocturnes.jpg')
sauver(etalonner(affiche.crop((654, 405, 1392, 735))), 'cabine-haut.jpg')
sauver(etalonner(affiche.crop((654, 765, 1394, 1112))), 'cabine-arche.jpg')
sauver(etalonner(Image.open(SRC / 'facade.jpg')), 'facade.jpg')

for f in sorted(SRC.glob('*.jpg')):
    if f.name in {'affiche-nocturnes.jpg', 'facade.jpg'}:
        continue
    nom = f.name.removeprefix('fb-')
    sauver(etalonner(reduire(Image.open(f))), nom)
```

Run: `cd site && python3 scripts/photos.py`
Expected : une ligne par fichier, dont `cabine-haut.jpg 738×330` et `cabine-arche.jpg 740×347`, et tous les fichiers de la liste « Produces » présents dans `src/assets/photos/`. Si une photo Facebook remplace un fichier de stock, elle doit s'appeler `fb-<nom-cible>.jpg` dans `photos-sources/`, par exemple `fb-hammam.jpg` pour `hammam.jpg`.

- [ ] **Step 5 : Planche contact et relecture**

```bash
python3 -c "
from PIL import Image, ImageDraw; import glob
fs=sorted(glob.glob('src/assets/photos/*.jpg')); W,H=360,240
s=Image.new('RGB',(W*5,(H+22)*((len(fs)+4)//5)),'white')
for i,f in enumerate(fs):
  im=Image.open(f); im.thumbnail((W,H)); x,y=(i%5)*W,(i//5)*(H+22); s.paste(im,(x,y)); ImageDraw.Draw(s).text((x+4,y+H+4),f.split('/')[-1],fill='black')
s.save('../.playwright-mcp/planche-photos.jpg',quality=80)"
```

Relire `../.playwright-mcp/planche-photos.jpg`. Chaque image doit illustrer son soin, et l'ensemble doit paraître d'une même famille (chaud, calme). Remplacer toute image qui ne passe pas.

- [ ] **Step 6 : Écrire `site/SOURCES-PHOTOS.md`**

Tableau `Fichier | Origine | URL | Licence | Statut`, une ligne par fichier de `src/assets/photos/`.
- Réelles (façade, cabine issue de l'affiche, Facebook) : licence « Propriété MEDI-SPA Saly », statut « à valider à la signature ».
- Unsplash : licence « Unsplash License », statut « OK ».
- Ajouter en tête : « Photos réelles utilisées uniquement pour la démo privée. Accord écrit de la gérante à obtenir avant mise en ligne publique. »
- Si Facebook ou Maps ont été inaccessibles, l'écrire dans une section « Notes ».

- [ ] **Step 7 : Supprimer les anciennes images et commiter**

```bash
rm -rf public/images
git add -A && git commit -m "Photos : vraie cabine recadrée, stock choisi soin par soin, étalonnage commun, sources tracées"
```

Le build passe toujours, mais l'ancienne page d'accueil pointe désormais vers des images `/images/…` absentes. C'est attendu : la Task 6 la remplace par un stub, puis la Task 8 par la vraie page.

---

### Task 6 : Modèle de contenu, réglages du site, textes d'interface

**Files :**
- Create: `site/src/data/site.json` (réécrit), `site/src/lib/site.ts`, `site/src/lib/site.test.ts`
- Create: `site/src/content.config.ts`
- Create: `site/src/content/soins/*.json` (7), `site/src/content/rituels/*.json` (3), `site/src/content/avis.json`
- Create: `site/src/i18n/ui.ts`, `site/src/i18n/ui.test.ts`
- Delete: `site/src/data/soins.json`, `site/src/data/rituels.json`, `site/src/pages/en.astro`
- Modify: `site/src/pages/index.astro` (remplacé par un stub temporaire)

**Interfaces :**
- Consumes : `Horaires` (Task 3), `Nocturne` (Task 3), `Texte`, `Lang` (Task 2).
- Produces :
  - `site: Site` (objet validé) et `schemaSite`, avec `type Site = { demo: boolean; nom: string; telephone: string; whatsapp: string; email: string; instagram: string; facebook?: string; adresse: Texte; rue: string; ville: string; horaires: Horaires; noteHoraires: Texte; note: number; nbAvis: number; ficheGoogle: string; lienAvisGoogle: string; requeteMaps: string; nocturnes: Nocturne[] }` ;
  - `telHref(): string` (`tel:+221785951515`) ;
  - collections `soins` (id = slug, ex. `massage-saly`), `rituels`, `avis` ;
  - `type Cle`, `ui: Record<Lang, Record<Cle, string>>`, `t(lang: Lang): (cle: Cle) => string`.

- [ ] **Step 1 : Test du schéma de site (échoue)**

<!-- fichier: site/src/lib/site.test.ts -->
```ts
import { describe, expect, it } from 'vitest';
import brut from '../data/site.json';
import { schemaSite, telHref } from './site';

describe('site.json', () => {
  it('respecte le schéma', () => {
    expect(() => schemaSite.parse(brut)).not.toThrow();
  });
  it('refuse un numéro WhatsApp avec + ou espaces', () => {
    expect(() => schemaSite.parse({ ...brut, whatsapp: '+221 78 595 15 15' })).toThrow();
  });
  it('refuse une plage horaire mal écrite', () => {
    expect(() => schemaSite.parse({ ...brut, horaires: { ...brut.horaires, lun: ['9h', '20h'] } })).toThrow();
  });
  it('refuse une nocturne dont la fin précède le début', () => {
    const t = { fr: 'x', en: 'x' };
    const nocturne = { debut: '2026-12-20', fin: '2026-12-19', heures: '18h–21h', quand: t, titre: t, texte: t };
    expect(() => schemaSite.parse({ ...brut, nocturnes: [nocturne] })).toThrow();
  });
  it('fabrique un lien tel: sans espaces', () => {
    expect(telHref()).toBe('tel:+221785951515');
  });
});
```

Run: `npm test` → Expected : FAIL (« ./site » introuvable).

- [ ] **Step 2 : `site.json` et `site.ts`**

<!-- fichier: site/src/data/site.json -->
```json
{
  "demo": true,
  "nom": "MEDI-SPA Saly",
  "telephone": "+221 78 595 15 15",
  "whatsapp": "221785951515",
  "email": "medispasaly@gmail.com",
  "instagram": "https://www.instagram.com/medi_spa_saly/",
  "adresse": { "fr": "Face Totem Saly, Saly Portudal, Sénégal", "en": "Opposite Totem Saly, Saly Portudal, Senegal" },
  "rue": "Face Totem Saly",
  "ville": "Saly Portudal",
  "horaires": {
    "lun": ["09:00", "20:00"],
    "mar": ["09:00", "20:00"],
    "mer": ["09:00", "20:00"],
    "jeu": ["09:00", "20:00"],
    "ven": ["09:00", "20:00"],
    "sam": ["09:00", "20:00"],
    "dim": null
  },
  "noteHoraires": { "fr": "Dimanche sur rendez-vous", "en": "Sundays by appointment" },
  "note": 4.8,
  "nbAvis": 70,
  "ficheGoogle": "https://www.google.com/maps/search/?api=1&query=MEDI-SPA%20Saly%20Face%20Totem%20Saly%20Portudal",
  "lienAvisGoogle": "https://www.google.com/maps/search/?api=1&query=MEDI-SPA%20Saly%20Face%20Totem%20Saly%20Portudal",
  "requeteMaps": "MEDI-SPA Saly, Face Totem, Saly Portudal, Sénégal",
  "nocturnes": []
}
```

Si le Step 2 de la Task 5 a trouvé l'URL Facebook ou le lien exact de la fiche Google, les renseigner ici (`"facebook": "…"`, `ficheGoogle`, `lienAvisGoogle`).

<!-- fichier: site/src/lib/site.ts -->
```ts
import { z } from 'astro/zod';
import brut from '../data/site.json';
import type { Horaires } from './horaires';
import type { Nocturne } from './nocturnes';

const texte = z.object({ fr: z.string().min(1), en: z.string().min(1) });
const heure = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const plage = z.tuple([heure, heure]).nullable();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const schemaSite = z.object({
  demo: z.boolean(),
  nom: z.string().min(1),
  telephone: z.string().min(1),
  whatsapp: z.string().regex(/^\d{11,15}$/, 'chiffres uniquement, indicatif compris (ex. 221785951515)'),
  email: z.email(),
  instagram: z.url(),
  facebook: z.url().optional(),
  adresse: texte,
  rue: z.string().min(1),
  ville: z.string().min(1),
  horaires: z.object({ lun: plage, mar: plage, mer: plage, jeu: plage, ven: plage, sam: plage, dim: plage }),
  noteHoraires: texte,
  note: z.number().min(0).max(5),
  nbAvis: z.number().int().nonnegative(),
  ficheGoogle: z.url(),
  lienAvisGoogle: z.url(),
  requeteMaps: z.string().min(1),
  nocturnes: z.array(
    z
      .object({ debut: date, fin: date, heures: z.string().min(1), quand: texte, titre: texte, texte: texte })
      .refine((n) => n.debut <= n.fin, 'la fin d’une nocturne précède son début'),
  ),
});

export type Site = Omit<z.infer<typeof schemaSite>, 'horaires' | 'nocturnes'> & { horaires: Horaires; nocturnes: Nocturne[] };

/** Validé au chargement : un site.json invalide fait échouer le build. */
export const site: Site = schemaSite.parse(brut);

export const telHref = () => `tel:${site.telephone.replace(/\s/g, '')}`;
```

Run: `npm test` → Expected : PASS (7 fichiers de test).

- [ ] **Step 3 : Schémas des collections**

<!-- fichier: site/src/content.config.ts -->
```ts
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const texte = z.object({ fr: z.string().min(1), en: z.string().min(1) });
const lignes = z.object({ fr: z.array(z.string().min(1)).min(1), en: z.array(z.string().min(1)).min(1) });
const memesLongueurs = (l: { fr: string[]; en: string[] }) => l.fr.length === l.en.length;

const soins = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/soins' }),
  schema: ({ image }) =>
    z.object({
      ordre: z.number().int(),
      categorie: z.enum(['corps', 'visage', 'eau', 'beaute', 'medi', 'cure']),
      vedette: z.boolean().default(false),
      image: image(),
      imageAlt: texte,
      titre: texte,
      accroche: texte,
      description: texte,
      deroule: lignes.refine(memesLongueurs, 'déroulé : autant de lignes en FR et en EN'),
      bienfaits: lignes.refine(memesLongueurs, 'bienfaits : autant de lignes en FR et en EN'),
      tarifs: z
        .array(z.object({ prix: z.number().int().nonnegative().nullable(), duree: z.string().optional(), libelle: texte.optional() }))
        .min(1),
      faq: z.array(z.object({ q: texte, r: texte })).default([]),
      seo: z.object({ titre: texte, description: texte }),
    }),
});

const rituels = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/rituels' }),
  schema: z.object({
    ordre: z.number().int(),
    nom: texte,
    duree: z.string(),
    contenu: lignes.refine(memesLongueurs, 'contenu : autant de lignes en FR et en EN'),
    prix: z.number().int().positive().nullable(),
    vedette: z.boolean().default(false),
  }),
});

// Avis Google recopiés mot pour mot. Jamais d'avis rédigé ou reformulé.
const avis = defineCollection({
  loader: file('src/content/avis.json'),
  schema: z.object({
    id: z.string(),
    auteur: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}$/),
    note: z.number().int().min(1).max(5),
    texte: z.string().min(1),
    langue: z.enum(['fr', 'en']),
    source: z.literal('google'),
  }),
});

export const collections = { soins, rituels, avis };
```

- [ ] **Step 4 : Les 7 soins**

**Rappel** : tous les prix sont indicatifs (mode démo). Aucune affirmation invérifiable : pas de marque de produit, pas de diplôme, pas de résultat chiffré.

<!-- fichier: site/src/content/soins/massage-saly.json -->
```json
{
  "ordre": 1,
  "categorie": "corps",
  "vedette": true,
  "image": "../../assets/photos/massage.jpg",
  "imageAlt": { "fr": "Massage du dos aux huiles chaudes", "en": "Warm oil back massage" },
  "titre": { "fr": "Massages", "en": "Massages" },
  "accroche": {
    "fr": "Relaxant, tonique ou à deux : une heure pour que le corps lâche enfin prise.",
    "en": "Relaxing, invigorating or side by side: an hour for your body to finally let go."
  },
  "description": {
    "fr": "Après une journée de plage, un vol long-courrier ou une semaine chargée, le massage remet le corps à zéro. Nous adaptons la pression à votre demande, de l'effleurage enveloppant au travail plus appuyé sur le dos et les épaules. Seul ou à deux, en cabine calme et climatisée, à deux pas du Totem de Saly.",
    "en": "After a day at the beach, a long-haul flight or a busy week, a massage resets the body. We adjust the pressure to what you ask for, from gentle enveloping strokes to deeper work on the back and shoulders. On your own or as a couple, in a calm, air-conditioned room a few steps from Saly's Totem."
  },
  "deroule": {
    "fr": ["Accueil et quelques questions : zones tendues, pression souhaitée.", "Installation en cabine, serviettes chaudes.", "Massage aux huiles, à votre rythme.", "Temps de repos et boisson avant de repartir."],
    "en": ["Welcome and a few questions: tense areas, preferred pressure.", "Settle into the room with warm towels.", "Oil massage at your own pace.", "Rest and a drink before you leave."]
  },
  "bienfaits": {
    "fr": ["Relâche les tensions du dos, de la nuque et des épaules", "Favorise un sommeil plus profond", "Aide à récupérer après le sport ou le voyage"],
    "en": ["Releases tension in the back, neck and shoulders", "Helps you sleep more deeply", "Aids recovery after sport or travel"]
  },
  "tarifs": [
    { "duree": "30 min", "libelle": { "fr": "Dos & épaules", "en": "Back & shoulders" }, "prix": 12000 },
    { "duree": "60 min", "libelle": { "fr": "Relaxant", "en": "Relaxing" }, "prix": 20000 },
    { "duree": "90 min", "libelle": { "fr": "Relaxant", "en": "Relaxing" }, "prix": 28000 },
    { "duree": "60 min", "libelle": { "fr": "Tonique", "en": "Invigorating" }, "prix": 22000 },
    { "duree": "60 min", "libelle": { "fr": "Duo, côte à côte", "en": "Couple, side by side" }, "prix": 38000 }
  ],
  "faq": [
    {
      "q": { "fr": "Peut-on se faire masser à deux ?", "en": "Can we have a massage together?" },
      "r": { "fr": "Oui, le massage duo se fait côte à côte dans la même cabine. Précisez-le simplement au moment de réserver.", "en": "Yes, the couple massage takes place side by side in the same room. Just mention it when you book." }
    },
    {
      "q": { "fr": "Que faut-il prévoir ?", "en": "What should I bring?" },
      "r": { "fr": "Rien : serviettes et sous-vêtements jetables sont fournis. Arrivez cinq minutes en avance pour profiter pleinement du soin.", "en": "Nothing: towels and disposable underwear are provided. Arrive five minutes early to make the most of your treatment." }
    },
    {
      "q": { "fr": "Est-ce possible pendant la grossesse ?", "en": "Is it possible during pregnancy?" },
      "r": { "fr": "Dites-le-nous en réservant : nous vous indiquerons le soin adapté, ou vous conseillerons d'attendre.", "en": "Tell us when you book: we will suggest a suitable treatment or advise you to wait." }
    }
  ],
  "seo": {
    "titre": { "fr": "Massage à Saly — relaxant, tonique, duo | MEDI-SPA Saly", "en": "Massage in Saly, Senegal — relaxing, invigorating, couples | MEDI-SPA Saly" },
    "description": {
      "fr": "Massage relaxant, tonique ou en duo à Saly Portudal, face au Totem. Noté 4,8/5 sur Google. Réservation en 1 minute sur WhatsApp.",
      "en": "Relaxing, invigorating or couples massage in Saly Portudal, opposite the Totem. Rated 4.8/5 on Google. Book in one minute on WhatsApp."
    }
  }
}
```

<!-- fichier: site/src/content/soins/soins-visage-corps-saly.json -->
```json
{
  "ordre": 2,
  "categorie": "visage",
  "vedette": true,
  "image": "../../assets/photos/visage.jpg",
  "imageAlt": { "fr": "Soin du visage en cabine", "en": "Facial treatment in the treatment room" },
  "titre": { "fr": "Soins visage & corps", "en": "Face & body treatments" },
  "accroche": {
    "fr": "Une peau nette, hydratée et lumineuse, même sous le soleil de la Petite-Côte.",
    "en": "Clear, hydrated, glowing skin, even under the Petite-Côte sun."
  },
  "description": {
    "fr": "Soleil, sel, climatisation : la peau est mise à l'épreuve à Saly. Chaque soin commence par un diagnostic, puis nous choisissons le protocole adapté à votre peau, qu'elle soit sèche, mixte ou sensible. Pour le corps, un gommage suivi d'une hydratation laisse la peau douce pendant des jours.",
    "en": "Sun, salt, air conditioning: skin is put to the test in Saly. Every treatment starts with a skin assessment, then we choose the routine that suits your skin, whether dry, combination or sensitive. For the body, a scrub followed by deep hydration leaves skin soft for days."
  },
  "deroule": {
    "fr": ["Diagnostic de peau.", "Nettoyage et exfoliation douce.", "Masque et massage du visage.", "Hydratation et protection solaire."],
    "en": ["Skin assessment.", "Cleansing and gentle exfoliation.", "Mask and facial massage.", "Moisturiser and sun protection."]
  },
  "bienfaits": {
    "fr": ["Teint plus uniforme et lumineux", "Peau hydratée en profondeur", "Adapté à tous les types de peau"],
    "en": ["A brighter, more even complexion", "Deeply hydrated skin", "Suitable for every skin type"]
  },
  "tarifs": [
    { "duree": "45 min", "libelle": { "fr": "Soin éclat visage", "en": "Radiance facial" }, "prix": 15000 },
    { "duree": "75 min", "libelle": { "fr": "Soin hydratant profond", "en": "Deep hydration facial" }, "prix": 25000 },
    { "duree": "30 min", "libelle": { "fr": "Gommage corps", "en": "Body scrub" }, "prix": 10000 }
  ],
  "faq": [
    {
      "q": { "fr": "Mon type de peau est-il concerné ?", "en": "Is it suitable for my skin type?" },
      "r": { "fr": "Oui : le diagnostic du début sert justement à adapter les produits et les gestes à votre peau.", "en": "Yes: the assessment at the start is there to adapt products and techniques to your skin." }
    },
    {
      "q": { "fr": "Peut-on s'exposer au soleil après ?", "en": "Can I go in the sun afterwards?" },
      "r": { "fr": "Nous terminons par une protection solaire et vous conseillons pour le reste de la journée.", "en": "We finish with sun protection and give you advice for the rest of the day." }
    }
  ],
  "seo": {
    "titre": { "fr": "Soin du visage à Saly — éclat, hydratation, gommage | MEDI-SPA Saly", "en": "Facials in Saly, Senegal — radiance, hydration, body scrub | MEDI-SPA Saly" },
    "description": {
      "fr": "Soins du visage et du corps à Saly Portudal : diagnostic, éclat, hydratation profonde, gommage. Pour toutes les peaux. Réservation WhatsApp.",
      "en": "Face and body treatments in Saly Portudal: skin assessment, radiance, deep hydration, body scrub. For every skin type. Book on WhatsApp."
    }
  }
}
```

<!-- fichier: site/src/content/soins/hammam-gommage-saly.json -->
```json
{
  "ordre": 3,
  "categorie": "eau",
  "vedette": true,
  "image": "../../assets/photos/hammam.jpg",
  "imageAlt": { "fr": "Vapeur du hammam", "en": "Steam in the hammam" },
  "titre": { "fr": "Hammam & gommage", "en": "Hammam & scrub" },
  "accroche": {
    "fr": "La chaleur ouvre, le gommage révèle : on ressort avec une peau neuve.",
    "en": "The heat opens up, the scrub reveals: you leave with brand-new skin."
  },
  "description": {
    "fr": "Le rituel du hammam commence par la vapeur, qui détend les muscles et prépare la peau. Vient ensuite le gommage au gant, qui retire les peaux mortes, puis un temps de repos. C'est le complément idéal d'une journée de plage, ou la meilleure façon de préparer un massage.",
    "en": "The hammam ritual starts with steam, which relaxes the muscles and prepares the skin. Then comes the glove scrub, which removes dead skin, followed by time to rest. It is the perfect complement to a beach day, or the best way to prepare for a massage."
  },
  "deroule": {
    "fr": ["Vapeur chaude pour détendre et ouvrir les pores.", "Application du savon.", "Gommage au gant sur tout le corps.", "Rinçage, hydratation et repos."],
    "en": ["Warm steam to relax and open the pores.", "Soap is applied.", "Full-body glove scrub.", "Rinse, moisturise and rest."]
  },
  "bienfaits": {
    "fr": ["Peau lisse et douce", "Muscles détendus", "Prépare la peau au bronzage et au massage"],
    "en": ["Smooth, soft skin", "Relaxed muscles", "Prepares the skin for tanning and massage"]
  },
  "tarifs": [
    { "duree": "30 min", "libelle": { "fr": "Hammam seul", "en": "Hammam only" }, "prix": 8000 },
    { "duree": "45 min", "libelle": { "fr": "Hammam + gommage", "en": "Hammam + scrub" }, "prix": 15000 },
    { "duree": "60 min", "libelle": { "fr": "Hammam + gommage + enveloppement", "en": "Hammam + scrub + body wrap" }, "prix": 20000 }
  ],
  "faq": [
    {
      "q": { "fr": "Faut-il apporter un maillot ?", "en": "Should I bring a swimsuit?" },
      "r": { "fr": "Ce n'est pas nécessaire : tout le linge est fourni. Vous pouvez en apporter un si vous préférez.", "en": "No need: all linen is provided. You are welcome to bring one if you prefer." }
    },
    {
      "q": { "fr": "Hammam et massage le même jour ?", "en": "Hammam and massage on the same day?" },
      "r": { "fr": "C'est même l'ordre idéal. Le rituel Teranga Glow réunit les deux.", "en": "That is the ideal order. The Teranga Glow ritual combines both." }
    }
  ],
  "seo": {
    "titre": { "fr": "Hammam à Saly — hammam, gommage, enveloppement | MEDI-SPA Saly", "en": "Hammam in Saly, Senegal — steam, scrub, body wrap | MEDI-SPA Saly" },
    "description": {
      "fr": "Hammam et gommage au gant à Saly Portudal, face au Totem. Vapeur, gommage, enveloppement. Idéal après la plage. Réservation WhatsApp.",
      "en": "Hammam and glove scrub in Saly Portudal, opposite the Totem. Steam, scrub, body wrap. Perfect after the beach. Book on WhatsApp."
    }
  }
}
```

<!-- fichier: site/src/content/soins/epilation-saly.json -->
```json
{
  "ordre": 4,
  "categorie": "beaute",
  "vedette": false,
  "image": "../../assets/photos/epilation.jpg",
  "imageAlt": { "fr": "Soin beauté en institut", "en": "Beauty treatment at the salon" },
  "titre": { "fr": "Épilation", "en": "Waxing" },
  "accroche": {
    "fr": "Précise, rapide et hygiénique, pour le visage comme pour le corps.",
    "en": "Precise, quick and hygienic, for face and body."
  },
  "description": {
    "fr": "Une épilation réussie tient à trois choses : une cire adaptée, un geste sûr et une hygiène sans faille. Spatule à usage unique, peau préparée puis apaisée après : vous repartez sans rougeur durable, prête pour la plage.",
    "en": "Good waxing comes down to three things: the right wax, a confident hand and flawless hygiene. Single-use spatulas, skin prepared beforehand and soothed afterwards: you leave without lasting redness, ready for the beach."
  },
  "deroule": {
    "fr": ["Préparation et nettoyage de la zone.", "Épilation à la cire, zone par zone.", "Soin apaisant pour finir."],
    "en": ["The area is prepared and cleansed.", "Waxing, zone by zone.", "A soothing lotion to finish."]
  },
  "bienfaits": {
    "fr": ["Peau nette pendant plusieurs semaines", "Hygiène stricte, matériel à usage unique", "Toutes zones, toutes peaux"],
    "en": ["Smooth skin for several weeks", "Strict hygiene, single-use tools", "Every area, every skin type"]
  },
  "tarifs": [
    { "libelle": { "fr": "Sourcils", "en": "Eyebrows" }, "prix": 3000 },
    { "libelle": { "fr": "Lèvre supérieure", "en": "Upper lip" }, "prix": 2000 },
    { "libelle": { "fr": "Aisselles", "en": "Underarms" }, "prix": 5000 },
    { "libelle": { "fr": "Maillot classique", "en": "Bikini line" }, "prix": 7000 },
    { "libelle": { "fr": "Demi-jambes", "en": "Half legs" }, "prix": 8000 },
    { "libelle": { "fr": "Jambes complètes", "en": "Full legs" }, "prix": 12000 }
  ],
  "faq": [
    {
      "q": { "fr": "Quelle longueur de poils faut-il ?", "en": "How long should the hair be?" },
      "r": { "fr": "Environ un demi-centimètre, soit trois semaines sans rasage, pour un résultat net.", "en": "About half a centimetre, roughly three weeks without shaving, for a clean result." }
    },
    {
      "q": { "fr": "Peut-on aller au soleil juste après ?", "en": "Can I go in the sun straight afterwards?" },
      "r": { "fr": "Mieux vaut attendre 24 heures avant une exposition directe ou une baignade en mer.", "en": "It is best to wait 24 hours before direct sun exposure or swimming in the sea." }
    }
  ],
  "seo": {
    "titre": { "fr": "Épilation à Saly — sourcils, jambes, maillot | MEDI-SPA Saly", "en": "Waxing in Saly, Senegal — brows, legs, bikini | MEDI-SPA Saly" },
    "description": {
      "fr": "Épilation à la cire à Saly Portudal : sourcils, aisselles, maillot, jambes. Hygiène stricte, matériel à usage unique. Réservation WhatsApp.",
      "en": "Waxing in Saly Portudal: brows, underarms, bikini line, legs. Strict hygiene, single-use tools. Book on WhatsApp."
    }
  }
}
```

<!-- fichier: site/src/content/soins/kinesitherapie-saly.json -->
```json
{
  "ordre": 5,
  "categorie": "medi",
  "vedette": false,
  "image": "../../assets/photos/kine.jpg",
  "imageAlt": { "fr": "Séance de kinésithérapie", "en": "Physiotherapy session" },
  "titre": { "fr": "Kinésithérapie", "en": "Physiotherapy" },
  "accroche": {
    "fr": "Le « Médi » de Médi-Spa : bouger mieux, avoir moins mal, récupérer plus vite.",
    "en": "The \"Medi\" in Medi-Spa: move better, hurt less, recover faster."
  },
  "description": {
    "fr": "Mal de dos, raideur, récupération après une blessure ou une opération : la kinésithérapie accompagne la remise en forme sur plusieurs séances. Tout commence par un bilan, puis un programme adapté à votre situation et à votre rythme.",
    "en": "Back pain, stiffness, recovery after an injury or surgery: physiotherapy supports your return to fitness over several sessions. Everything starts with an assessment, then a programme tailored to your situation and pace."
  },
  "deroule": {
    "fr": ["Bilan : vos douleurs, vos antécédents, vos objectifs.", "Séance : mobilisation, renforcement, massage thérapeutique.", "Conseils et exercices à refaire chez vous."],
    "en": ["Assessment: your pain, history and goals.", "Session: mobilisation, strengthening, therapeutic massage.", "Advice and exercises to repeat at home."]
  },
  "bienfaits": {
    "fr": ["Soulage les douleurs de dos et de nuque", "Accompagne la récupération après blessure", "Programme suivi sur plusieurs séances"],
    "en": ["Relieves back and neck pain", "Supports recovery after injury", "A programme followed over several sessions"]
  },
  "tarifs": [{ "libelle": { "fr": "Séance, après bilan", "en": "Session, after assessment" }, "prix": null }],
  "faq": [
    {
      "q": { "fr": "Faut-il une ordonnance ?", "en": "Do I need a prescription?" },
      "r": { "fr": "Écrivez-nous sur WhatsApp en décrivant votre situation : nous vous indiquerons la marche à suivre.", "en": "Message us on WhatsApp describing your situation: we will tell you how to proceed." }
    }
  ],
  "seo": {
    "titre": { "fr": "Kinésithérapie à Saly — dos, récupération, remise en forme | MEDI-SPA Saly", "en": "Physiotherapy in Saly, Senegal — back pain, recovery, fitness | MEDI-SPA Saly" },
    "description": {
      "fr": "Kinésithérapie à Saly Portudal, face au Totem : bilan, séances de rééducation et de remise en forme. Prise de rendez-vous sur WhatsApp.",
      "en": "Physiotherapy in Saly Portudal, opposite the Totem: assessment, rehabilitation and fitness sessions. Appointments on WhatsApp."
    }
  }
}
```

<!-- fichier: site/src/content/soins/balneo-saly.json -->
```json
{
  "ordre": 6,
  "categorie": "eau",
  "vedette": false,
  "image": "../../assets/photos/balneo.jpg",
  "imageAlt": { "fr": "Bain bouillonnant de balnéothérapie", "en": "Whirlpool balneotherapy bath" },
  "titre": { "fr": "Balnéo", "en": "Balneotherapy" },
  "accroche": {
    "fr": "L'eau chaude qui masse : trente minutes d'apesanteur, seule ou à deux.",
    "en": "Warm water that massages: thirty minutes of weightlessness, alone or together."
  },
  "description": {
    "fr": "Les jets d'eau chaude massent tout le corps en douceur et dénouent les tensions sans effort. La balnéo se suffit à elle-même, ou prépare parfaitement un massage. Idéale en fin de journée, notamment lors de nos soirées nocturnes.",
    "en": "Warm water jets gently massage the whole body and ease tension effortlessly. Balneotherapy is lovely on its own or as the perfect prelude to a massage. Ideal at the end of the day, especially during our late-night evenings."
  },
  "deroule": {
    "fr": ["Douche et installation.", "Bain bouillonnant à température douce.", "Repos et boisson."],
    "en": ["Shower and settle in.", "Whirlpool bath at a gentle temperature.", "Rest and a drink."]
  },
  "bienfaits": {
    "fr": ["Détente musculaire globale", "Circulation stimulée, jambes légères", "Un moment à partager à deux"],
    "en": ["All-over muscle relaxation", "Boosted circulation, lighter legs", "A moment to share as a couple"]
  },
  "tarifs": [
    { "duree": "30 min", "libelle": { "fr": "Solo", "en": "Solo" }, "prix": 10000 },
    { "duree": "30 min", "libelle": { "fr": "Duo", "en": "Couple" }, "prix": 18000 }
  ],
  "faq": [
    {
      "q": { "fr": "Est-ce déconseillé dans certains cas ?", "en": "Is it unsuitable in some cases?" },
      "r": { "fr": "En cas de grossesse, de problème cardiaque ou de circulation, signalez-le-nous avant de réserver.", "en": "If you are pregnant or have heart or circulation problems, please tell us before booking." }
    }
  ],
  "seo": {
    "titre": { "fr": "Balnéo à Saly — bain bouillonnant solo ou duo | MEDI-SPA Saly", "en": "Balneotherapy in Saly, Senegal — whirlpool bath for one or two | MEDI-SPA Saly" },
    "description": {
      "fr": "Balnéothérapie à Saly Portudal : bain bouillonnant chaud, seul ou en duo, face au Totem. Parfait avant un massage. Réservation WhatsApp.",
      "en": "Balneotherapy in Saly Portudal: warm whirlpool bath, alone or as a couple, opposite the Totem. Perfect before a massage. Book on WhatsApp."
    }
  }
}
```

<!-- fichier: site/src/content/soins/amincissement-saly.json -->
```json
{
  "ordre": 7,
  "categorie": "cure",
  "vedette": false,
  "image": "../../assets/photos/amincissement.jpg",
  "imageAlt": { "fr": "Soin du corps en cabine", "en": "Body treatment in the treatment room" },
  "titre": { "fr": "Amincissement", "en": "Body contouring" },
  "accroche": {
    "fr": "Un programme sur mesure, décidé ensemble après un bilan offert.",
    "en": "A tailored programme, agreed together after a free assessment."
  },
  "description": {
    "fr": "Chaque silhouette est différente, alors nous ne vendons pas de cure toute faite. Le bilan offert permet de définir vos zones prioritaires et un rythme de séances réaliste. Drainage, modelage et soins corps se combinent ensuite pour affiner et raffermir.",
    "en": "Every body is different, so we do not sell ready-made packages. The free assessment helps define your priority areas and a realistic session schedule. Drainage, sculpting massage and body treatments are then combined to refine and firm."
  },
  "deroule": {
    "fr": ["Bilan offert : objectifs, zones, rythme.", "Séances de drainage et de modelage.", "Point d'étape régulier pour ajuster le programme."],
    "en": ["Free assessment: goals, areas, schedule.", "Drainage and sculpting sessions.", "Regular check-ins to adjust the programme."]
  },
  "bienfaits": {
    "fr": ["Sensation de légèreté", "Peau plus ferme et plus lisse", "Suivi personnalisé"],
    "en": ["A feeling of lightness", "Firmer, smoother skin", "Personal follow-up"]
  },
  "tarifs": [
    { "libelle": { "fr": "Bilan", "en": "Assessment" }, "prix": 0 },
    { "duree": "60 min", "libelle": { "fr": "Séance", "en": "Session" }, "prix": 20000 },
    { "libelle": { "fr": "Programme 10 séances", "en": "10-session programme" }, "prix": 180000 }
  ],
  "faq": [
    {
      "q": { "fr": "Combien de séances faut-il ?", "en": "How many sessions are needed?" },
      "r": { "fr": "Cela dépend de vos objectifs : c'est tout l'intérêt du bilan offert, qui fixe un rythme réaliste.", "en": "It depends on your goals: that is exactly what the free assessment is for, setting a realistic schedule." }
    }
  ],
  "seo": {
    "titre": { "fr": "Amincissement à Saly — drainage, modelage, bilan offert | MEDI-SPA Saly", "en": "Body contouring in Saly, Senegal — drainage, sculpting, free assessment | MEDI-SPA Saly" },
    "description": {
      "fr": "Programme amincissement sur mesure à Saly Portudal : bilan offert, drainage, modelage, suivi personnalisé. Réservation WhatsApp.",
      "en": "Tailored body contouring programme in Saly Portudal: free assessment, drainage, sculpting massage, personal follow-up. Book on WhatsApp."
    }
  }
}
```

- [ ] **Step 5 : Les 3 rituels et le fichier d'avis**

<!-- fichier: site/src/content/rituels/escale-saly.json -->
```json
{
  "ordre": 1,
  "nom": { "fr": "Escale Saly", "en": "Saly Stopover" },
  "duree": "60 min",
  "contenu": {
    "fr": ["Gommage corps", "Massage dos & épaules 30 min", "Soin éclat visage express"],
    "en": ["Body scrub", "30-min back & shoulder massage", "Express radiance facial"]
  },
  "prix": 25000,
  "vedette": false
}
```

<!-- fichier: site/src/content/rituels/teranga-glow.json -->
```json
{
  "ordre": 2,
  "nom": { "fr": "Teranga Glow", "en": "Teranga Glow" },
  "duree": "90 min",
  "contenu": {
    "fr": ["Hammam", "Gommage au gant", "Massage relaxant 60 min", "Thé offert"],
    "en": ["Hammam", "Glove scrub", "60-min relaxing massage", "Complimentary tea"]
  },
  "prix": 35000,
  "vedette": true
}
```

<!-- fichier: site/src/content/rituels/parenthese-a-deux.json -->
```json
{
  "ordre": 3,
  "nom": { "fr": "Parenthèse à deux", "en": "Time for Two" },
  "duree": "75 min",
  "contenu": {
    "fr": ["Balnéo duo 15 min", "Massage duo 60 min, côte à côte", "Pour couples, amies, mère et fille"],
    "en": ["15-min couple balneotherapy", "60-min couple massage, side by side", "For couples, friends, mothers and daughters"]
  },
  "prix": 55000,
  "vedette": false
}
```

`site/src/content/avis.json` contient les avis recopiés mot pour mot au Step 2 de la Task 5, au format suivant (un objet par avis) :

```json
[{ "id": "g1", "auteur": "Prénom N.", "date": "2026-08", "note": 5, "texte": "…texte exact…", "langue": "fr", "source": "google" }]
```

S'il n'y a aucun avis vérifié, écrire exactement `[]`.

- [ ] **Step 6 : Textes d'interface — test de parité (échoue)**

<!-- fichier: site/src/i18n/ui.test.ts -->
```ts
import { describe, expect, it } from 'vitest';
import { ui } from './ui';

describe('textes d’interface', () => {
  it('ont exactement les mêmes clés en FR et en EN', () => {
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.fr).sort());
  });
  it('n’ont aucune valeur vide', () => {
    for (const lang of ['fr', 'en'] as const) {
      for (const [cle, valeur] of Object.entries(ui[lang])) expect(valeur.trim(), `${lang}.${cle}`).not.toBe('');
    }
  });
  it('n’oublient pas de traduire (aucune valeur EN identique au FR, sauf noms propres)', () => {
    const identiques = Object.keys(ui.fr).filter((c) => ui.fr[c as keyof typeof ui.fr] === ui.en[c as keyof typeof ui.en]);
    expect(identiques.sort()).toEqual(['contact.titre', 'cta.whatsapp', 'nav.menu'].sort());
  });
});
```

- [ ] **Step 7 : Écrire `ui.ts`**

<!-- fichier: site/src/i18n/ui.ts -->
```ts
import type { Lang } from '../lib/i18n';

const fr = {
  'skip': 'Aller au contenu',
  'demo.bandeau': 'Démo — tarifs et textes indicatifs, à valider avec vous',
  'nav.soins': 'Soins',
  'nav.rituels': 'Rituels',
  'nav.cadeau': 'Carte cadeau',
  'nav.infos': 'Nous trouver',
  'nav.menu': 'Menu',
  'nav.fermer': 'Fermer',
  'langue.lien': 'English',
  'langue.label': 'Read this page in English',
  'cta.reserver': 'Réserver',
  'cta.whatsapp': 'WhatsApp',
  'cta.appeler': 'Appeler',
  'cta.decouvrir': 'Découvrir',
  'hero.surtitre': 'Centre de bien-être · Saly Portudal',
  'hero.titre1': 'Le calme,',
  'hero.titre2': 'à deux pas de la plage.',
  'hero.texte': 'Massages, hammam, balnéo, soins du visage et kinésithérapie, face au Totem de Saly.',
  'hero.cta2': 'Voir les soins',
  'preuves.label': 'En bref',
  'preuves.adresse': 'Face Totem, Saly Portudal',
  'preuves.langues': 'Accueil en français et en anglais',
  'preuves.paiement': 'Wave · Orange Money · espèces',
  'photo.hero': 'Massage en cabine, lumière douce',
  'photo.facade': 'La façade de MEDI-SPA Saly, face au Totem',
  'photo.cabine': 'Une cabine de soin de MEDI-SPA Saly',
  'photo.ambiance': 'Ambiance du spa : serviettes, huiles et plantes',
  'avis.surGoogle': 'sur Google',
  'avis.avis': 'avis',
  'avis.titre': 'Ce qu’en disent nos clientes',
  'avis.voir': 'Lire les avis sur Google',
  'avis.laisser': 'Laisser un avis',
  'avis.source': 'Avis Google',
  'soins.surtitre': 'La carte',
  'soins.titre': 'Nos soins',
  'soins.intro': 'Du massage à la kinésithérapie, chaque soin commence par vous écouter.',
  'soins.aPartirDe': 'à partir de',
  'soins.voirTout': 'Toute la carte',
  'soins.tous': 'Tous',
  'soins.filtrer': 'Filtrer par catégorie',
  'cat.corps': 'Corps',
  'cat.visage': 'Visage',
  'cat.eau': 'Rituels d’eau',
  'cat.beaute': 'Beauté',
  'cat.medi': 'Médical',
  'cat.cure': 'Cure',
  'rituels.surtitre': 'Forfaits',
  'rituels.titre': 'Les rituels',
  'rituels.intro': 'Plusieurs soins enchaînés, pensés pour se compléter.',
  'rituels.vedette': 'Notre signature',
  'cadeau.teaser.surtitre': 'À offrir',
  'cadeau.teaser.titre': 'Offrez une parenthèse.',
  'cadeau.teaser.texte': 'Un montant ou un rituel, votre petit mot, et la carte est prête : anniversaire, mariage, fête des mères, ou simplement merci.',
  'cadeau.teaser.cta': 'Créer une carte cadeau',
  'lieu.surtitre': 'Face au Totem',
  'lieu.titre': 'Une vraie adresse, une équipe attentive.',
  'lieu.p1': 'Linge frais à chaque soin, matériel désinfecté, protocoles rigoureux : le « Médi » de notre nom, c’est d’abord l’hygiène.',
  'lieu.p2': 'Des cabines calmes et climatisées, à quelques minutes de la plage et des hôtels de Saly.',
  'lieu.p3': 'On vous accueille en français et en anglais.',
  'nocturnes.surtitre': 'Nocturnes · 18 h – 21 h',
  'nocturnes.titre': 'Le spa, la nuit.',
  'nocturnes.texte': 'Certains vendredis et samedis, le spa reste ouvert jusqu’à 21 h : massage solo ou duo, hammam, balnéo. Les dates sont annoncées sur Instagram.',
  'nocturnes.cta': 'Demander les prochaines dates',
  'nocturnes.prochaines': 'Prochaines nocturnes',
  'nocturnes.reserver': 'Réserver ma soirée',
  'nocturnes.bandeau': 'Nocturnes',
  'infos.surtitre': 'Infos pratiques',
  'infos.titre': 'Nous trouver',
  'infos.horaires': 'Horaires',
  'infos.ferme': 'Fermé',
  'infos.adresse': 'Adresse',
  'infos.paiement': 'Paiement',
  'infos.paiementTexte': 'Espèces, Wave, Orange Money.',
  'infos.carte': 'Afficher la carte',
  'infos.carteNote': 'La carte est fournie par Google et se charge au clic.',
  'infos.itineraire': 'Itinéraire',
  'contact.titre': 'Contact',
  'jour.lun': 'Lundi',
  'jour.mar': 'Mardi',
  'jour.mer': 'Mercredi',
  'jour.jeu': 'Jeudi',
  'jour.ven': 'Vendredi',
  'jour.sam': 'Samedi',
  'jour.dim': 'Dimanche',
  'fiche.deroule': 'Le déroulé',
  'fiche.bienfaits': 'Les bienfaits',
  'fiche.tarifs': 'Tarifs',
  'fiche.faq': 'Questions fréquentes',
  'fiche.autres': 'Vous aimerez aussi',
  'fiche.reserver': 'Réserver ce soin',
  'fiche.question': 'Une question ? Écrivez-nous',
  'fil.label': 'Fil d’Ariane',
  'fil.accueil': 'Accueil',
  'resa.surtitre': 'Réservation',
  'resa.titre': 'Réserver en une minute',
  'resa.intro': 'Quatre choix, et votre demande part sur WhatsApp. Nous confirmons l’horaire exact rapidement.',
  'resa.etape1': 'Le soin',
  'resa.etape2': 'La formule',
  'resa.etape3': 'Le jour',
  'resa.etape4': 'Le moment',
  'resa.prenom': 'Votre prénom',
  'resa.envoyer': 'Envoyer sur WhatsApp',
  'resa.recap': 'Votre demande',
  'resa.indispo': 'Indisponible',
  'resa.dimanche': 'Le dimanche, uniquement sur rendez-vous : écrivez-nous directement.',
  'resa.erreur.soin': 'Choisissez un soin.',
  'resa.erreur.formule': 'Choisissez une formule.',
  'resa.erreur.jour': 'Choisissez un jour.',
  'resa.erreur.creneau': 'Choisissez un moment de la journée.',
  'resa.erreur.prenom': 'Indiquez votre prénom.',
  'resa.sansJs': 'Ce formulaire a besoin de JavaScript. Écrivez-nous directement sur WhatsApp :',
  'resa.apres': 'WhatsApp s’ouvre avec votre message déjà écrit : il ne reste qu’à l’envoyer.',
  'creneau.matin': 'Matin',
  'creneau.apres-midi': 'Après-midi',
  'creneau.soir': 'Soir',
  'cadeau.surtitre': 'Carte cadeau',
  'cadeau.titre': 'Offrir un moment MEDI-SPA',
  'cadeau.intro': 'Choisissez, personnalisez, et commandez sur WhatsApp. Nous vous envoyons le lien de paiement, puis la carte prête à offrir.',
  'cadeau.choix': 'Ce que vous offrez',
  'cadeau.montant': 'Un montant',
  'cadeau.rituel': 'Un rituel',
  'cadeau.libre': 'Autre montant',
  'cadeau.librePlaceholder': 'ex. 30 000',
  'cadeau.de': 'De la part de',
  'cadeau.pour': 'Pour',
  'cadeau.mot': 'Petit mot (facultatif)',
  'cadeau.envoyer': 'Commander sur WhatsApp',
  'cadeau.paiement': 'Paiement Wave, Orange Money ou espèces sur place.',
  'cadeau.apercu': 'Aperçu de la carte',
  'cadeau.carteTitre': 'Carte cadeau',
  'cadeau.carteDe': 'De la part de',
  'cadeau.cartePour': 'Pour',
  'cadeau.erreur.vide': 'Indiquez un montant.',
  'cadeau.erreur.invalide': 'Montant en chiffres, par exemple 30 000.',
  'cadeau.erreur.trop-bas': 'Minimum 10 000 FCFA.',
  'cadeau.erreur.trop-haut': 'Maximum 500 000 FCFA.',
  'cadeau.erreur.de': 'Indiquez votre prénom.',
  'cadeau.erreur.pour': 'Indiquez le prénom de la personne.',
  'pied.baseline': 'Massages, hammam, balnéo, soins et kinésithérapie à Saly Portudal.',
  'pied.suivre': 'Nous suivre',
  'barre.label': 'Contact rapide',
  'e404.titre': 'Cette page s’est évaporée.',
  'e404.texte': 'Comme la vapeur du hammam. Revenez à l’accueil, ou écrivez-nous.',
  'e404.cta': 'Retour à l’accueil',
  'meta.accueil.titre': 'MEDI-SPA Saly — Massage, hammam, balnéo et soins à Saly Portudal',
  'meta.accueil.description': 'Centre de bien-être à Saly Portudal, face au Totem. Noté 4,8/5 sur Google. Massages, hammam, balnéo, soins visage, épilation, kinésithérapie. Réservation WhatsApp.',
  'meta.soins.titre': 'Soins et tarifs — MEDI-SPA Saly',
  'meta.soins.description': 'La carte complète de MEDI-SPA Saly : massages, soins visage & corps, hammam, balnéo, épilation, kinésithérapie, amincissement. Tarifs et durées.',
  'meta.reserver.titre': 'Réserver un soin — MEDI-SPA Saly',
  'meta.reserver.description': 'Choisissez votre soin, votre jour et votre moment : votre demande part sur WhatsApp, nous confirmons rapidement.',
  'meta.cadeau.titre': 'Carte cadeau spa à Saly — MEDI-SPA Saly',
  'meta.cadeau.description': 'Offrez un massage, un hammam ou un rituel à Saly. Carte cadeau personnalisée, paiement Wave, Orange Money ou espèces.',
} as const;

export type Cle = keyof typeof fr;

const en: Record<Cle, string> = {
  'skip': 'Skip to content',
  'demo.bandeau': 'Demo — indicative prices and copy, to be confirmed with you',
  'nav.soins': 'Treatments',
  'nav.rituels': 'Rituals',
  'nav.cadeau': 'Gift card',
  'nav.infos': 'Find us',
  'nav.menu': 'Menu',
  'nav.fermer': 'Close',
  'langue.lien': 'Français',
  'langue.label': 'Lire cette page en français',
  'cta.reserver': 'Book',
  'cta.whatsapp': 'WhatsApp',
  'cta.appeler': 'Call',
  'cta.decouvrir': 'Discover',
  'hero.surtitre': 'Wellness centre · Saly Portudal',
  'hero.titre1': 'Calm,',
  'hero.titre2': 'a short walk from the beach.',
  'hero.texte': 'Massages, hammam, balneotherapy, facials and physiotherapy, opposite the Totem in Saly.',
  'hero.cta2': 'See treatments',
  'preuves.label': 'At a glance',
  'preuves.adresse': 'Opposite the Totem, Saly Portudal',
  'preuves.langues': 'French & English spoken',
  'preuves.paiement': 'Wave · Orange Money · cash',
  'photo.hero': 'Massage in a softly lit treatment room',
  'photo.facade': 'The MEDI-SPA Saly frontage, opposite the Totem',
  'photo.cabine': 'A MEDI-SPA Saly treatment room',
  'photo.ambiance': 'Spa atmosphere: towels, oils and plants',
  'avis.surGoogle': 'on Google',
  'avis.avis': 'reviews',
  'avis.titre': 'What our guests say',
  'avis.voir': 'Read the reviews on Google',
  'avis.laisser': 'Leave a review',
  'avis.source': 'Google review',
  'soins.surtitre': 'The menu',
  'soins.titre': 'Our treatments',
  'soins.intro': 'From massage to physiotherapy, every treatment starts by listening to you.',
  'soins.aPartirDe': 'from',
  'soins.voirTout': 'Full menu',
  'soins.tous': 'All',
  'soins.filtrer': 'Filter by category',
  'cat.corps': 'Body',
  'cat.visage': 'Face',
  'cat.eau': 'Water rituals',
  'cat.beaute': 'Beauty',
  'cat.medi': 'Medical',
  'cat.cure': 'Programme',
  'rituels.surtitre': 'Packages',
  'rituels.titre': 'Signature rituals',
  'rituels.intro': 'Several treatments in a row, designed to complement each other.',
  'rituels.vedette': 'Our signature',
  'cadeau.teaser.surtitre': 'To give',
  'cadeau.teaser.titre': 'Give a moment of calm.',
  'cadeau.teaser.texte': 'An amount or a ritual, your message, and the card is ready: birthdays, weddings, Mother’s Day, or simply to say thank you.',
  'cadeau.teaser.cta': 'Create a gift card',
  'lieu.surtitre': 'Opposite the Totem',
  'lieu.titre': 'A real place, a caring team.',
  'lieu.p1': 'Fresh linen for every treatment, disinfected equipment, rigorous protocols: the “Medi” in our name starts with hygiene.',
  'lieu.p2': 'Calm, air-conditioned treatment rooms, a few minutes from the beach and Saly’s hotels.',
  'lieu.p3': 'We welcome you in French and English.',
  'nocturnes.surtitre': 'Late nights · 6 pm – 9 pm',
  'nocturnes.titre': 'The spa, after dark.',
  'nocturnes.texte': 'On some Fridays and Saturdays, the spa stays open until 9 pm: solo or couple massage, hammam, balneotherapy. Dates are announced on Instagram.',
  'nocturnes.cta': 'Ask for the next dates',
  'nocturnes.prochaines': 'Upcoming late nights',
  'nocturnes.reserver': 'Book my evening',
  'nocturnes.bandeau': 'Late nights',
  'infos.surtitre': 'Practical info',
  'infos.titre': 'Find us',
  'infos.horaires': 'Opening hours',
  'infos.ferme': 'Closed',
  'infos.adresse': 'Address',
  'infos.paiement': 'Payment',
  'infos.paiementTexte': 'Cash, Wave, Orange Money.',
  'infos.carte': 'Show the map',
  'infos.carteNote': 'The map is provided by Google and loads when you click.',
  'infos.itineraire': 'Directions',
  'contact.titre': 'Contact',
  'jour.lun': 'Monday',
  'jour.mar': 'Tuesday',
  'jour.mer': 'Wednesday',
  'jour.jeu': 'Thursday',
  'jour.ven': 'Friday',
  'jour.sam': 'Saturday',
  'jour.dim': 'Sunday',
  'fiche.deroule': 'What to expect',
  'fiche.bienfaits': 'Benefits',
  'fiche.tarifs': 'Prices',
  'fiche.faq': 'Frequently asked questions',
  'fiche.autres': 'You may also like',
  'fiche.reserver': 'Book this treatment',
  'fiche.question': 'A question? Message us',
  'fil.label': 'Breadcrumb',
  'fil.accueil': 'Home',
  'resa.surtitre': 'Booking',
  'resa.titre': 'Book in one minute',
  'resa.intro': 'Four choices, and your request goes out on WhatsApp. We confirm the exact time quickly.',
  'resa.etape1': 'Treatment',
  'resa.etape2': 'Option',
  'resa.etape3': 'Day',
  'resa.etape4': 'Time of day',
  'resa.prenom': 'Your first name',
  'resa.envoyer': 'Send on WhatsApp',
  'resa.recap': 'Your request',
  'resa.indispo': 'Unavailable',
  'resa.dimanche': 'On Sundays, by appointment only: message us directly.',
  'resa.erreur.soin': 'Choose a treatment.',
  'resa.erreur.formule': 'Choose an option.',
  'resa.erreur.jour': 'Choose a day.',
  'resa.erreur.creneau': 'Choose a time of day.',
  'resa.erreur.prenom': 'Enter your first name.',
  'resa.sansJs': 'This form needs JavaScript. Message us directly on WhatsApp:',
  'resa.apres': 'WhatsApp opens with your message already written: just press send.',
  'creneau.matin': 'Morning',
  'creneau.apres-midi': 'Afternoon',
  'creneau.soir': 'Evening',
  'cadeau.surtitre': 'Gift card',
  'cadeau.titre': 'Give a MEDI-SPA moment',
  'cadeau.intro': 'Choose, personalise and order on WhatsApp. We send you the payment link, then the card, ready to give.',
  'cadeau.choix': 'What you are giving',
  'cadeau.montant': 'An amount',
  'cadeau.rituel': 'A ritual',
  'cadeau.libre': 'Other amount',
  'cadeau.librePlaceholder': 'e.g. 30,000',
  'cadeau.de': 'From',
  'cadeau.pour': 'To',
  'cadeau.mot': 'Short message (optional)',
  'cadeau.envoyer': 'Order on WhatsApp',
  'cadeau.paiement': 'Pay by Wave, Orange Money or cash on site.',
  'cadeau.apercu': 'Card preview',
  'cadeau.carteTitre': 'Gift card',
  'cadeau.carteDe': 'From',
  'cadeau.cartePour': 'For',
  'cadeau.erreur.vide': 'Enter an amount.',
  'cadeau.erreur.invalide': 'Amount in figures, for example 30,000.',
  'cadeau.erreur.trop-bas': 'Minimum 10,000 FCFA.',
  'cadeau.erreur.trop-haut': 'Maximum 500,000 FCFA.',
  'cadeau.erreur.de': 'Enter your first name.',
  'cadeau.erreur.pour': 'Enter the recipient’s first name.',
  'pied.baseline': 'Massages, hammam, balneotherapy, treatments and physiotherapy in Saly Portudal.',
  'pied.suivre': 'Follow us',
  'barre.label': 'Quick contact',
  'e404.titre': 'This page has evaporated.',
  'e404.texte': 'Like steam in the hammam. Head back home, or message us.',
  'e404.cta': 'Back to home',
  'meta.accueil.titre': 'MEDI-SPA Saly — Massage, hammam, balneotherapy & treatments in Saly, Senegal',
  'meta.accueil.description': 'Wellness centre in Saly Portudal, opposite the Totem. Rated 4.8/5 on Google. Massages, hammam, balneotherapy, facials, waxing, physiotherapy. Book on WhatsApp.',
  'meta.soins.titre': 'Treatments & prices — MEDI-SPA Saly',
  'meta.soins.description': 'The full MEDI-SPA Saly menu: massages, face & body treatments, hammam, balneotherapy, waxing, physiotherapy, body contouring. Prices and durations.',
  'meta.reserver.titre': 'Book a treatment — MEDI-SPA Saly',
  'meta.reserver.description': 'Choose your treatment, day and time of day: your request goes out on WhatsApp and we confirm quickly.',
  'meta.cadeau.titre': 'Spa gift card in Saly, Senegal — MEDI-SPA Saly',
  'meta.cadeau.description': 'Give a massage, hammam or ritual in Saly. Personalised gift card, pay by Wave, Orange Money or cash.',
};

export const ui: Record<Lang, Record<Cle, string>> = { fr, en };
export const t = (lang: Lang) => (cle: Cle) => ui[lang][cle];
```

Run: `npm test` → Expected : PASS (8 fichiers de test).

- [ ] **Step 8 : Remplacer temporairement les anciennes pages et vérifier le build des collections**

```bash
rm src/data/soins.json src/data/rituels.json src/pages/en.astro
```

<!-- fichier: site/src/pages/index.astro#stub-task6 -->
```astro
---
// Page temporaire : remplacée à la Task 8. Sert à vérifier que les collections se chargent.
import { getCollection } from 'astro:content';
const soins = await getCollection('soins');
const rituels = await getCollection('rituels');
const avis = await getCollection('avis');
---
<p>{soins.length} soins · {rituels.length} rituels · {avis.length} avis</p>
```

Extraction : `python3 ../scripts/extraire.py 'site/src/pages/index.astro#stub-task6'`

Run: `npm run build && grep -o "[0-9] soins · [0-9] rituels · [0-9]* avis" dist/index.html`
Expected : `7 soins · 3 rituels · N avis` (N = nombre d'avis vérifiés, éventuellement 0).

- [ ] **Step 9 : Commit**

```bash
git add -A && git commit -m "Contenu : 7 soins et 3 rituels FR/EN validés par schéma, réglages du site, textes d'interface"
```

---
### Task 7 : Layout et composants communs

**Files :**
- Create: `site/src/layouts/Base.astro`
- Create: `site/src/components/Logo.astro`, `LotusIcone.astro`, `Header.astro`, `Footer.astro`, `BarreMobile.astro`, `BandeauDemo.astro`, `BanniereNocturne.astro`, `Photo.astro`, `Titre.astro`, `FilAriane.astro`
- Create: `site/src/scripts/reveal.ts`, `site/src/scripts/nocturnes.ts`
- Modify: `site/src/styles/global.css` (ajout en fin de fichier)
- Delete: `site/src/layouts/Base.astro` (ancien, remplacé)
- Modify: `site/src/pages/index.astro` (stub utilisant `Base`)

**Interfaces :**
- Consumes : `site`, `telHref` (Task 6) ; `t`, `Cle` (Task 6) ; `chemin`, `autreLangue`, `Page` (Task 2) ; `nocturnesAVenir`, `estPassee` (Task 3) ; `lienWhatsApp`, `messageInfo` (Task 4).
- Produces :
  - `<Base lang titre description page slug? schemas? image?>`, avec `page: Page | '404'` ;
  - `<Photo src alt sizes forme? prioritaire? class? imgClass? widths?>`, avec `forme: 'rect' | 'arche' | 'arche-inverse' | 'rond'` ;
  - `<Titre titre surtitre? intro? centre? niveau? fond?>`, avec `niveau: 'h1' | 'h2'`, `fond: 'clair' | 'taupe' | 'sombre'` et un slot nommé `titre` pour du HTML ;
  - `<FilAriane lang etapes>`, avec `etapes: { nom: string; href: string }[]` ;
  - `<Logo variante? sombre? class?>`, `<LotusIcone class?>` ;
  - classes CSS `.pastille`, `.pastille-jour`, `.menu-icone`.

- [ ] **Step 1 : Styles complémentaires (ajouter à la fin de `global.css`)**

```css
summary::-webkit-details-marker { display: none; }

/* Icône du menu mobile : deux traits qui se croisent à l'ouverture */
.menu-icone { position: relative; width: 22px; height: 12px; }
.menu-icone::before, .menu-icone::after {
  content: ''; position: absolute; left: 0; right: 0; height: 1.5px; background: currentColor;
  transition: transform .3s var(--ease-doux), top .3s var(--ease-doux);
}
.menu-icone::before { top: 2px; }
.menu-icone::after { top: 9px; }
.menu[open] .menu-icone::before { top: 5.5px; transform: rotate(45deg); }
.menu[open] .menu-icone::after { top: 5.5px; transform: rotate(-45deg); }

/* Choix sous forme de pastilles (radios masqués) */
.pastille {
  @apply relative flex cursor-pointer items-center justify-center gap-2 border border-encre/20 bg-creme px-4 py-3 text-center text-[15px] transition-colors;
}
.pastille:hover { @apply border-encre/60; }
.pastille:has(input:checked) { @apply border-encre bg-encre text-creme; }
.pastille:has(input:disabled) { @apply cursor-not-allowed border-encre/10 text-encre/35; }
.pastille:has(input:focus-visible) { outline: 3px solid var(--color-or-profond); outline-offset: 2px; }
.pastille-jour { @apply w-[4.6rem] shrink-0 flex-col gap-1 px-2 py-3; }
```

- [ ] **Step 2 : Petits composants**

<!-- fichier: site/src/components/Logo.astro -->
```astro
---
// Emblème M + lotus inspiré du logo de l'affiche. À remplacer par le fichier officiel à la signature.
interface Props { variante?: 'complet' | 'embleme'; sombre?: boolean; class?: string }
const { variante = 'complet', sombre = false, class: cls = '' } = Astro.props;
---
<span class:list={['inline-flex items-center gap-3', cls]}>
  <svg viewBox="0 0 64 64" class:list={['h-11 w-11 shrink-0', sombre ? 'text-or' : 'text-or-vif']} aria-hidden="true">
    <circle cx="32" cy="32" r="30.5" fill="none" stroke="currentColor" stroke-width="1.2" />
    <text x="29" y="43" text-anchor="middle" font-family="'Cormorant Garamond Variable', Georgia, serif" font-size="34" font-weight="500" fill="currentColor">M</text>
    <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M46 42c-2.6-2.4-2.6-6.6 0-9 2.6 2.4 2.6 6.6 0 9Z" />
      <path d="M46 42c-3.8-.4-6.4-3-6.8-6.8 3.8.4 6.4 3 6.8 6.8Z" />
      <path d="M46 42c3.8-.4 6.4-3 6.8-6.8-3.8.4-6.4 3-6.8 6.8Z" />
      <path d="M46 42c-.2 5-3.6 8.6-9 10" />
    </g>
  </svg>
  {variante === 'complet' && (
    <span class="leading-none">
      <span class:list={['block font-serif text-[21px] font-medium tracking-[.16em]', sombre ? 'text-creme' : 'text-encre']}>MEDI-SPA</span>
      <span class:list={['mt-1 block text-[10px] uppercase tracking-[.55em]', sombre ? 'text-or' : 'text-brun']}>Saly</span>
    </span>
  )}
</span>
```

<!-- fichier: site/src/components/LotusIcone.astro -->
```astro
---
interface Props { class?: string }
const { class: cls = 'h-5 w-5' } = Astro.props;
---
<svg viewBox="0 0 24 24" class={cls} fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 19c-3-2.8-3-7.6 0-10.4 3 2.8 3 7.6 0 10.4Z" />
  <path d="M12 19c-4.4-.4-7.4-3.4-7.8-7.8 4.4.4 7.4 3.4 7.8 7.8Z" />
  <path d="M12 19c4.4-.4 7.4-3.4 7.8-7.8-4.4.4-7.4 3.4-7.8 7.8Z" />
</svg>
```

<!-- fichier: site/src/components/Photo.astro -->
```astro
---
import { Picture } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Props {
  src: ImageMetadata;
  alt: string;
  sizes: string;
  forme?: 'rect' | 'arche' | 'arche-inverse' | 'rond';
  prioritaire?: boolean;
  widths?: number[];
  class?: string;
  imgClass?: string;
}
const { src, alt, sizes, forme = 'rect', prioritaire = false, widths = [480, 800, 1200, 1600], class: cls = '', imgClass = '' } = Astro.props;
// Jamais de largeur supérieure à l'original : on plafonne et on dédoublonne.
const largeurs = [...new Set(widths.map((w) => Math.min(w, src.width)))];
const masque = { rect: '', arche: 'arche', 'arche-inverse': 'arche-inverse', rond: 'rounded-full' }[forme];
---
<div class:list={['overflow-hidden', masque, cls]}>
  <Picture
    src={src}
    alt={alt}
    formats={['avif', 'webp']}
    widths={largeurs}
    sizes={sizes}
    loading={prioritaire ? 'eager' : 'lazy'}
    fetchpriority={prioritaire ? 'high' : 'auto'}
    decoding={prioritaire ? 'sync' : 'async'}
    class:list={['h-full w-full object-cover', imgClass]}
  />
</div>
```

<!-- fichier: site/src/components/Titre.astro -->
```astro
---
interface Props {
  titre: string;
  surtitre?: string;
  intro?: string;
  centre?: boolean;
  niveau?: 'h1' | 'h2';
  fond?: 'clair' | 'taupe' | 'sombre';
  class?: string;
}
const { titre, surtitre, intro, centre = false, niveau = 'h2', fond = 'clair', class: cls = '' } = Astro.props;
const Balise = niveau;
// Contrastes : or-profond seulement sur fond clair ; brun sur taupe ; or sur fond sombre.
const couleurSurtitre = { clair: 'text-or-profond', taupe: 'text-brun', sombre: 'text-or' }[fond];
const couleurIntro = { clair: 'text-brun', taupe: 'text-brun', sombre: 'text-creme/75' }[fond];
---
<div class:list={['max-w-2xl', centre && 'mx-auto text-center', cls]}>
  {surtitre && <p class:list={['surtitre reveal', couleurSurtitre]}>{surtitre}</p>}
  <Balise class:list={['reveal mt-4 leading-[1.02]', niveau === 'h1' ? 'text-5xl sm:text-6xl lg:text-7xl' : 'text-4xl sm:text-5xl lg:text-6xl']} style="--d:.06s">
    <slot name="titre">{titre}</slot>
  </Balise>
  {intro && <p class:list={['reveal mt-5 text-lg leading-relaxed', couleurIntro]} style="--d:.12s">{intro}</p>}
</div>
```

<!-- fichier: site/src/components/FilAriane.astro -->
```astro
---
import type { Lang } from '../lib/i18n';
import { t } from '../i18n/ui';

interface Props { lang: Lang; etapes: { nom: string; href: string }[] }
const { lang, etapes } = Astro.props;
const _ = t(lang);
---
<nav aria-label={_('fil.label')} class="text-[12px] uppercase tracking-[.14em] text-brun">
  <ol class="flex flex-wrap items-center gap-2">
    {etapes.map((e, i) => (
      <li class="flex items-center gap-2">
        {i > 0 && <span aria-hidden="true">/</span>}
        {i < etapes.length - 1 ? <a href={e.href} class="lien-trait">{e.nom}</a> : <span aria-current="page" class="text-encre">{e.nom}</span>}
      </li>
    ))}
  </ol>
</nav>
```

<!-- fichier: site/src/components/BandeauDemo.astro -->
```astro
---
import type { Lang } from '../lib/i18n';
import { t } from '../i18n/ui';
interface Props { lang: Lang }
const _ = t(Astro.props.lang);
---
<div role="note" class="bg-encre px-4 py-1.5 text-center text-[11px] tracking-[.14em] text-or">{_('demo.bandeau')}</div>
```

<!-- fichier: site/src/components/BanniereNocturne.astro -->
```astro
---
import type { Lang } from '../lib/i18n';
import { nocturnesAVenir } from '../lib/nocturnes';
import { chemin } from '../lib/routes';
import { site } from '../lib/site';
import { t } from '../i18n/ui';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
// Évaluée au build ; scripts/nocturnes.ts la retire côté navigateur si la date passe entre deux builds.
const prochaine = nocturnesAVenir(site.nocturnes, new Date())[0];
---
{prochaine && (
  <div data-fin={prochaine.fin} class="bg-taupe px-4 py-2 text-center text-[13px] text-encre">
    <span class="surtitre mr-2">{_('nocturnes.bandeau')}</span>
    {prochaine.quand[lang]} · {prochaine.heures}
    <a href={chemin('reserver', lang)} class="ml-2 underline underline-offset-4">{_('nocturnes.reserver')}</a>
  </div>
)}
```

<!-- fichier: site/src/components/BarreMobile.astro -->
```astro
---
import type { Lang } from '../lib/i18n';
import { site, telHref } from '../lib/site';
import { lienWhatsApp, messageInfo } from '../lib/whatsapp';
import { t } from '../i18n/ui';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
---
<nav aria-label={_('barre.label')} class="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 border-t border-encre/10 bg-creme/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
  <a href={telHref()} class="py-3.5 text-center text-[12px] uppercase tracking-[.2em]">{_('cta.appeler')}</a>
  <a href={lienWhatsApp(site.whatsapp, messageInfo(undefined, lang))} target="_blank" rel="noopener" class="bg-encre py-3.5 text-center text-[12px] uppercase tracking-[.2em] text-creme">{_('cta.whatsapp')}</a>
</nav>
```

- [ ] **Step 3 : En-tête et pied de page**

<!-- fichier: site/src/components/Header.astro -->
```astro
---
import type { Lang } from '../lib/i18n';
import { autreLangue, chemin, type Page } from '../lib/routes';
import { t } from '../i18n/ui';
import Logo from './Logo.astro';

interface Props { lang: Lang; page: Page | '404'; slug?: string }
const { lang, page, slug } = Astro.props;
const _ = t(lang);
const autre = autreLangue(lang);
const versAutre = page === '404' ? chemin('accueil', autre) : chemin(page, autre, slug);
const accueil = chemin('accueil', lang);
const liens = [
  { href: chemin('soins', lang), label: _('nav.soins'), actif: page === 'soins' || page === 'soin' },
  { href: `${accueil}#rituels`, label: _('nav.rituels'), actif: false },
  { href: chemin('carte-cadeau', lang), label: _('nav.cadeau'), actif: page === 'carte-cadeau' },
  { href: `${accueil}#infos`, label: _('nav.infos'), actif: false },
];
---
<header class="sticky top-0 z-40 border-b border-encre/10 bg-creme/90 backdrop-blur-md">
  <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
    <a href={accueil} class="shrink-0" aria-label={`MEDI-SPA Saly — ${_('fil.accueil')}`}><Logo /></a>
    <nav aria-label="Navigation" class="hidden lg:block">
      <ul class="flex items-center gap-9 text-[13px] uppercase tracking-[.12em]">
        {liens.map((l) => <li><a href={l.href} class="lien-trait py-1" aria-current={l.actif ? 'page' : undefined}>{l.label}</a></li>)}
      </ul>
    </nav>
    <div class="flex items-center gap-2 sm:gap-5">
      <a href={versAutre} lang={autre} hreflang={autre} title={_('langue.label')} class="hidden text-[12px] uppercase tracking-[.14em] text-brun hover:text-encre sm:inline">{_('langue.lien')}</a>
      <a href={chemin('reserver', lang)} aria-current={page === 'reserver' ? 'page' : undefined} class="bg-encre px-5 py-2.5 text-[12px] uppercase tracking-[.18em] text-creme transition-colors hover:bg-or-profond">{_('cta.reserver')}</a>
      <details class="menu lg:hidden">
        <summary class="flex h-10 w-10 cursor-pointer list-none items-center justify-center" aria-label={_('nav.menu')}>
          <span class="menu-icone" aria-hidden="true"></span>
        </summary>
        <div class="absolute inset-x-0 top-full border-b border-encre/10 bg-creme px-5 pb-8 pt-2 shadow-xl">
          <ul class="divide-y divide-encre/10 font-serif text-2xl">
            {liens.map((l) => <li><a href={l.href} class="block py-4" aria-current={l.actif ? 'page' : undefined}>{l.label}</a></li>)}
            <li><a href={versAutre} lang={autre} hreflang={autre} class="block py-4 font-sans text-sm uppercase tracking-[.14em] text-brun">{_('langue.lien')}</a></li>
          </ul>
        </div>
      </details>
    </div>
  </div>
</header>

<script>
  document.querySelectorAll<HTMLDetailsElement>('details.menu').forEach((menu) => {
    menu.addEventListener('click', (e) => {
      if ((e.target as Element).closest('a')) menu.open = false;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') menu.open = false;
    });
  });
</script>
```

<!-- fichier: site/src/components/Footer.astro -->
```astro
---
import { getCollection } from 'astro:content';
import type { Lang } from '../lib/i18n';
import { autreLangue, chemin, type Page } from '../lib/routes';
import { site, telHref } from '../lib/site';
import { t } from '../i18n/ui';
import Logo from './Logo.astro';

interface Props { lang: Lang; page: Page | '404'; slug?: string }
const { lang, page, slug } = Astro.props;
const _ = t(lang);
const autre = autreLangue(lang);
const versAutre = page === '404' ? chemin('accueil', autre) : chemin(page, autre, slug);
const soins = (await getCollection('soins')).sort((a, b) => a.data.ordre - b.data.ordre);
const reseaux = [
  { nom: 'Instagram', href: site.instagram },
  ...(site.facebook ? [{ nom: 'Facebook', href: site.facebook }] : []),
  { nom: 'Google', href: site.ficheGoogle },
];
---
<footer class="grain sombre bg-encre text-creme/80">
  <div class="mx-auto grid max-w-7xl gap-12 px-5 pb-12 pt-16 md:grid-cols-12 md:px-8">
    <div class="md:col-span-4">
      <Logo sombre />
      <p class="mt-6 max-w-xs text-sm leading-relaxed">{_('pied.baseline')}</p>
    </div>
    <div class="md:col-span-3">
      <p class="surtitre text-or">{_('nav.soins')}</p>
      <ul class="mt-4 space-y-2 text-sm">
        {soins.map((s) => <li><a class="lien-trait" href={chemin('soin', lang, s.id)}>{s.data.titre[lang]}</a></li>)}
      </ul>
    </div>
    <div class="md:col-span-3">
      <p class="surtitre text-or">{_('contact.titre')}</p>
      <ul class="mt-4 space-y-2 text-sm">
        <li>{site.adresse[lang]}</li>
        <li><a class="lien-trait" href={telHref()}>{site.telephone}</a></li>
        <li><a class="lien-trait" href={`mailto:${site.email}`}>{site.email}</a></li>
      </ul>
    </div>
    <div class="md:col-span-2">
      <p class="surtitre text-or">{_('pied.suivre')}</p>
      <ul class="mt-4 space-y-2 text-sm">
        {reseaux.map((r) => <li><a class="lien-trait" href={r.href} target="_blank" rel="noopener">{r.nom}</a></li>)}
      </ul>
    </div>
  </div>
  <div class="border-t border-creme/10">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 pb-24 pt-6 text-xs text-creme/70 md:px-8 md:pb-6">
      <p>© {new Date().getFullYear()} {site.nom}</p>
      <a href={versAutre} lang={autre} hreflang={autre} class="lien-trait">{_('langue.lien')}</a>
    </div>
  </div>
</footer>
```

- [ ] **Step 4 : Scripts globaux**

<!-- fichier: site/src/scripts/reveal.ts -->
```ts
const elements = document.querySelectorAll<HTMLElement>('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entrees) => {
      for (const e of entrees) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
  );
  elements.forEach((el) => io.observe(el));
} else {
  elements.forEach((el) => el.classList.add('visible'));
}
```

<!-- fichier: site/src/scripts/nocturnes.ts -->
```ts
import { estPassee } from '../lib/nocturnes';

// Une démo construite il y a des semaines ne doit pas annoncer une nocturne déjà passée.
const maintenant = new Date();
document.querySelectorAll<HTMLElement>('[data-fin]').forEach((el) => {
  if (el.dataset.fin && estPassee(el.dataset.fin, maintenant)) el.remove();
});
```

- [ ] **Step 5 : Le layout**

<!-- fichier: site/src/layouts/Base.astro -->
```astro
---
import '../styles/global.css';
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { Lang } from '../lib/i18n';
import { chemin, type Page } from '../lib/routes';
import { site } from '../lib/site';
import { t } from '../i18n/ui';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import BarreMobile from '../components/BarreMobile.astro';
import BandeauDemo from '../components/BandeauDemo.astro';
import BanniereNocturne from '../components/BanniereNocturne.astro';
import photoParDefaut from '../assets/photos/hero.jpg';

interface Props {
  lang: Lang;
  titre: string;
  description: string;
  page: Page | '404';
  slug?: string;
  schemas?: object[];
  image?: ImageMetadata;
}
const { lang, titre, description, page, slug, schemas = [], image = photoParDefaut } = Astro.props;
const _ = t(lang);
const base = Astro.site!;
const estPage = page !== '404';
const url = (l: Lang) => new URL(chemin(page as Page, l, slug), base).href;
const og = await getImage({ src: image, width: 1200, height: 630, fit: 'cover', format: 'jpg' });
---
<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>{titre}</title>
    <meta name="description" content={description} />
    {site.demo && <meta name="robots" content="noindex, nofollow" />}
    {estPage && (
      <>
        <link rel="canonical" href={url(lang)} />
        <link rel="alternate" hreflang="fr" href={url('fr')} />
        <link rel="alternate" hreflang="en" href={url('en')} />
        <link rel="alternate" hreflang="x-default" href={url('fr')} />
        <meta property="og:url" content={url(lang)} />
      </>
    )}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={site.nom} />
    <meta property="og:locale" content={lang === 'fr' ? 'fr_FR' : 'en_GB'} />
    <meta property="og:title" content={titre} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={new URL(og.src, base).href} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#F7F1E8" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <script is:inline>document.documentElement.classList.add('js')</script>
    {schemas.map((s) => <script type="application/ld+json" set:html={JSON.stringify(s)} />)}
  </head>
  <body>
    <a href="#contenu" class="skip-link">{_('skip')}</a>
    {site.demo && <BandeauDemo lang={lang} />}
    <BanniereNocturne lang={lang} />
    <Header lang={lang} page={page} slug={slug} />
    <main id="contenu"><slot /></main>
    <Footer lang={lang} page={page} slug={slug} />
    <BarreMobile lang={lang} />
    <script>
      import '../scripts/reveal';
      import '../scripts/nocturnes';
    </script>
  </body>
</html>
```

- [ ] **Step 6 : Stub d'accueil sur le nouveau layout**

<!-- fichier: site/src/pages/index.astro#stub-task7 -->
```astro
---
// Stub : remplacé par le vrai contenu à la Task 8.
import Base from '../layouts/Base.astro';
---
<Base lang="fr" page="accueil" titre="MEDI-SPA Saly" description="Centre de bien-être à Saly Portudal : massages, hammam, balnéo, soins, épilation, kinésithérapie.">
  <h1 class="mx-auto max-w-7xl px-5 py-24 text-6xl">Test du layout</h1>
</Base>
```

- [ ] **Step 7 : Vérifier le rendu HTML**

Run:

```bash
npm run build && for motif in 'hreflang="en" href="https://medi-spa-saly.sn/en/"' 'name="robots" content="noindex' 'Démo — tarifs' 'wa.me/221785951515?text=' 'href="/soins/massage-saly/"' 'og:image'; do grep -q "$motif" dist/index.html && echo "OK  $motif" || echo "KO  $motif"; done
```

Expected : 6 lignes `OK`.

- [ ] **Step 8 : Contrôle visuel de l'en-tête et du pied (390 px et 1440 px)**

`npm run preview` en arrière-plan, puis Playwright : captures de `http://localhost:4321/` en 390 × 844 et 1440 × 900, plus une capture avec le menu mobile ouvert (clic sur `summary`).

Vérifier :
- le logo est lisible ;
- rien ne déborde à 390 px ;
- le menu s'ouvre sous l'en-tête sur toute la largeur ;
- la barre Appeler / WhatsApp est collée en bas et ne masque pas le © du pied de page ;
- le bandeau démo est discret.

Corriger avant de commiter.

- [ ] **Step 9 : Commit**

```bash
git add -A && git commit -m "Layout : en-tête, pied, barre mobile, SEO de base (canonical, hreflang, OG, noindex démo)"
```

---

### Task 8 : Page d'accueil FR/EN

**Files :**
- Create: `site/src/components/CarteSoin.astro`, `CarteCadeauVisuel.astro`, `CarteMaps.astro`, `Rituels.astro`, `TeaserCadeau.astro`
- Create: `site/src/components/accueil/Hero.astro`, `Preuves.astro`, `SoinsPhares.astro`, `Nocturnes.astro`, `Lieu.astro`, `Avis.astro`, `Infos.astro`
- Create: `site/src/components/pages/Accueil.astro`
- Create: `site/src/scripts/carte-maps.ts`
- Modify: `site/src/pages/index.astro` ; Create: `site/src/pages/en/index.astro`

**Interfaces :**
- Consumes : tout ce qui a été produit par les Tasks 2 à 7.
- Produces :
  - `<CarteSoin soin lang>`, avec `soin: CollectionEntry<'soins'>` ;
  - `<Rituels lang>` (section `#rituels`) et `<TeaserCadeau lang>`, réutilisés par la Task 9 ;
  - `<CarteCadeauVisuel lang offre pour de mot? class?>`, dont les champs sont marqués `data-champ="offre|pour|de|mot"`, réutilisé et animé par la Task 11 ;
  - `<CarteMaps lang>`.
  - Le schéma `DaySpa` de l'accueil est ajouté à la Task 9, qui crée `schema-org.ts`.

- [ ] **Step 1 : Composants partagés**

<!-- fichier: site/src/components/CarteSoin.astro -->
```astro
---
import type { CollectionEntry } from 'astro:content';
import type { Lang } from '../lib/i18n';
import { aPartirDe } from '../lib/prix';
import { chemin } from '../lib/routes';
import { t, type Cle } from '../i18n/ui';
import Photo from './Photo.astro';

interface Props { soin: CollectionEntry<'soins'>; lang: Lang; titre?: 'h2' | 'h3' }
const { soin, lang, titre = 'h3' } = Astro.props;
const _ = t(lang);
const d = soin.data;
const Balise = titre;
---
<a href={chemin('soin', lang, soin.id)} class="group block">
  <Photo src={d.image} alt={d.imageAlt[lang]} forme="arche" sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw" class="aspect-[4/5] bg-taupe" imgClass="transition-transform duration-[1.2s] ease-[var(--ease-doux)] group-hover:scale-105" />
  <p class="surtitre mt-6 text-or-profond">{_(`cat.${d.categorie}` as Cle)}</p>
  <Balise class="mt-2 text-3xl leading-tight">{d.titre[lang]}</Balise>
  <p class="mt-2 leading-relaxed text-brun">{d.accroche[lang]}</p>
  <p class="mt-5 flex items-center justify-between border-t border-encre/15 pt-4 text-sm">
    <span>{aPartirDe(d.tarifs, lang)}</span>
    <span class="fleche text-or-vif" aria-hidden="true">→</span>
  </p>
</a>
```

<!-- fichier: site/src/components/CarteCadeauVisuel.astro -->
```astro
---
import type { Lang } from '../lib/i18n';
import { t } from '../i18n/ui';
import Logo from './Logo.astro';

interface Props { lang: Lang; offre: string; pour: string; de: string; mot?: string; class?: string }
const { lang, offre, pour, de, mot = '', class: cls = '' } = Astro.props;
const _ = t(lang);
---
<div class:list={['grain sombre relative aspect-[1.6/1] w-full overflow-hidden rounded-2xl bg-encre p-6 text-creme shadow-2xl sm:p-8', cls]}>
  <div class="pointer-events-none absolute inset-3 rounded-xl border border-or/35" aria-hidden="true"></div>
  <div class="arche pointer-events-none absolute -bottom-24 -right-10 h-64 w-48 border border-or/20" aria-hidden="true"></div>
  <div class="relative flex h-full flex-col">
    <div class="flex items-start justify-between gap-4">
      <Logo variante="embleme" sombre />
      <p class="surtitre text-or">{_('cadeau.carteTitre')}</p>
    </div>
    <p class="mt-auto break-words font-serif text-4xl leading-none text-or sm:text-5xl" data-champ="offre">{offre}</p>
    <p class="mt-2 min-h-[1.5em] line-clamp-2 font-serif text-base italic text-creme/80" data-champ="mot">{mot}</p>
    <div class="mt-3 flex justify-between gap-4 border-t border-or/25 pt-3 text-[11px] uppercase tracking-[.14em] text-creme/70">
      <span>{_('cadeau.cartePour')} <span class="normal-case tracking-normal text-creme" data-champ="pour">{pour}</span></span>
      <span class="text-right">{_('cadeau.carteDe')} <span class="normal-case tracking-normal text-creme" data-champ="de">{de}</span></span>
    </div>
  </div>
</div>
```

<!-- fichier: site/src/components/CarteMaps.astro -->
```astro
---
import type { Lang } from '../lib/i18n';
import { site } from '../lib/site';
import { t } from '../i18n/ui';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
const src = `https://www.google.com/maps?q=${encodeURIComponent(site.requeteMaps)}&hl=${lang}&output=embed`;
---
<div class="carte-maps relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden bg-taupe p-8 text-center lg:aspect-auto lg:h-full lg:min-h-[480px]" data-src={src} data-titre={`Google Maps — ${site.nom}`}>
  <div class="arche pointer-events-none absolute left-1/2 top-10 h-[130%] w-[70%] -translate-x-1/2 border border-encre/15" aria-hidden="true"></div>
  <svg viewBox="0 0 24 24" class="relative h-10 w-10 text-or-profond" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 1 1 13 0c0 5.2-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>
  <p class="relative mt-4 font-serif text-2xl">{site.adresse[lang]}</p>
  <button type="button" class="relative mt-6 bg-encre px-7 py-3.5 text-[12px] uppercase tracking-[.18em] text-creme transition-colors hover:bg-or-profond">{_('infos.carte')}</button>
  <p class="relative mt-3 max-w-xs text-xs text-brun">{_('infos.carteNote')}</p>
</div>

<script>
  import '../scripts/carte-maps';
</script>
```

<!-- fichier: site/src/scripts/carte-maps.ts -->
```ts
// La carte Google ne se charge qu'au clic : pas de cookies ni de 500 Ko de JS tiers au chargement.
document.querySelectorAll<HTMLElement>('.carte-maps').forEach((bloc) => {
  bloc.querySelector('button')?.addEventListener(
    'click',
    () => {
      const iframe = document.createElement('iframe');
      iframe.src = bloc.dataset.src ?? '';
      iframe.title = bloc.dataset.titre ?? 'Google Maps';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.className = 'absolute inset-0 h-full w-full border-0';
      bloc.replaceChildren(iframe);
    },
    { once: true },
  );
});
```

<!-- fichier: site/src/components/Rituels.astro -->
```astro
---
import { getCollection } from 'astro:content';
import type { Lang } from '../lib/i18n';
import { formaterPrix } from '../lib/prix';
import { chemin } from '../lib/routes';
import { t } from '../i18n/ui';
import Titre from './Titre.astro';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
const rituels = (await getCollection('rituels')).sort((a, b) => a.data.ordre - b.data.ordre);
---
<section id="rituels" class="scroll-mt-20 bg-taupe py-20 md:py-28">
  <div class="mx-auto max-w-7xl px-5 md:px-8">
    <Titre fond="taupe" centre surtitre={_('rituels.surtitre')} titre={_('rituels.titre')} intro={_('rituels.intro')} />
    <ul class="mt-16 grid gap-8 md:grid-cols-3 md:items-stretch md:gap-6">
      {rituels.map((r, i) => {
        const v = r.data.vedette;
        return (
          <li class:list={['reveal relative flex flex-col p-8 md:p-10', v ? 'grain sombre bg-encre text-creme md:-my-5' : 'bg-creme']} style={`--d:${i * 0.08}s`}>
            {v && <span class="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-or px-4 py-1 text-[10px] uppercase tracking-[.22em] text-encre">{_('rituels.vedette')}</span>}
            <p class:list={['surtitre', v ? 'text-or' : 'text-or-profond']}>{r.data.duree}</p>
            <h3 class="mt-3 text-4xl">{r.data.nom[lang]}</h3>
            <ul class="mt-6 flex-1 space-y-2.5">
              {r.data.contenu[lang].map((c) => (
                <li class="flex gap-3">
                  <span class:list={['mt-2.5 h-1 w-1 shrink-0 rounded-full', v ? 'bg-or' : 'bg-or-vif']} aria-hidden="true"></span>
                  <span class:list={[v ? 'text-creme/85' : 'text-brun']}>{c}</span>
                </li>
              ))}
            </ul>
            <p class="mt-8 font-serif text-3xl">{formaterPrix(r.data.prix, lang)}</p>
            <a href={`${chemin('reserver', lang)}?soin=${r.id}`} class:list={['mt-6 block py-3.5 text-center text-[12px] uppercase tracking-[.2em] transition-colors', v ? 'bg-or text-encre hover:bg-creme' : 'border border-encre/30 hover:bg-encre hover:text-creme']}>
              {_('cta.reserver')} <span class="fleche" aria-hidden="true">→</span>
            </a>
          </li>
        );
      })}
    </ul>
  </div>
</section>
```

<!-- fichier: site/src/components/TeaserCadeau.astro -->
```astro
---
import type { Lang } from '../lib/i18n';
import { formaterPrix } from '../lib/prix';
import { chemin } from '../lib/routes';
import { t } from '../i18n/ui';
import CarteCadeauVisuel from './CarteCadeauVisuel.astro';
import Titre from './Titre.astro';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
---
<section class="overflow-hidden py-20 md:py-28">
  <div class="mx-auto grid max-w-7xl items-center gap-16 px-5 md:px-8 lg:grid-cols-2">
    <div class="reveal relative mx-auto w-full max-w-md py-6">
      <div class="absolute inset-0 translate-x-6 translate-y-4 rotate-[5deg] rounded-2xl bg-taupe" aria-hidden="true"></div>
      <CarteCadeauVisuel lang={lang} offre={formaterPrix(50000, lang)} pour="Awa" de="Moussa" mot={lang === 'fr' ? 'Pour ta journée à toi.' : 'A day just for you.'} class="rotate-[-3deg]" />
    </div>
    <div>
      <Titre surtitre={_('cadeau.teaser.surtitre')} titre={_('cadeau.teaser.titre')} intro={_('cadeau.teaser.texte')} />
      <a href={chemin('carte-cadeau', lang)} class="reveal mt-9 inline-block bg-encre px-8 py-4 text-[12px] uppercase tracking-[.2em] text-creme transition-colors hover:bg-or-profond" style="--d:.18s">
        {_('cadeau.teaser.cta')} <span class="fleche" aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 2 : Sections de l'accueil**

<!-- fichier: site/src/components/accueil/Hero.astro -->
```astro
---
import type { Lang } from '../../lib/i18n';
import { chemin } from '../../lib/routes';
import { site } from '../../lib/site';
import { t } from '../../i18n/ui';
import Photo from '../Photo.astro';
import hero from '../../assets/photos/hero.jpg';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
const note = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB').format(site.note);
---
<section class="relative overflow-hidden">
  <div class="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-10 md:px-8 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-16">
    <div class="lg:col-span-6">
      <p class="surtitre text-or-profond">{_('hero.surtitre')}</p>
      <h1 class="mt-5 text-[2.9rem] leading-[1] sm:text-6xl lg:text-[5.4rem]">
        {_('hero.titre1')}<br /><em class="text-or-profond">{_('hero.titre2')}</em>
      </h1>
      <p class="mt-7 max-w-md text-lg leading-relaxed text-brun">{_('hero.texte')}</p>
      <div class="mt-9 flex flex-wrap gap-3">
        <a href={chemin('reserver', lang)} class="bg-encre px-8 py-4 text-[12px] uppercase tracking-[.2em] text-creme transition-colors hover:bg-or-profond">{_('cta.reserver')} <span class="fleche" aria-hidden="true">→</span></a>
        <a href={chemin('soins', lang)} class="border border-encre/25 px-8 py-4 text-[12px] uppercase tracking-[.2em] transition-colors hover:border-encre hover:bg-encre hover:text-creme">{_('hero.cta2')}</a>
      </div>
      <a href={site.ficheGoogle} target="_blank" rel="noopener" class="mt-10 inline-flex items-center gap-3 text-sm text-brun hover:text-encre">
        <span class="tracking-[.15em] text-or-vif" aria-hidden="true">★★★★★</span>
        <span><strong class="font-medium text-encre">{note}/5</strong> {_('avis.surGoogle')} · {site.nbAvis} {_('avis.avis')}</span>
      </a>
    </div>
    <div class="relative lg:col-span-6">
      <Photo src={hero} alt={_('photo.hero')} forme="arche" prioritaire sizes="(min-width: 1024px) 560px, 100vw" class="mx-auto aspect-[5/6] w-full max-w-[560px] bg-taupe" />
      <div class="absolute -bottom-7 left-3 flex h-32 w-32 flex-col items-center justify-center rounded-full bg-taupe text-center shadow-xl ring-8 ring-creme sm:left-10 lg:-left-4">
        <span class="font-serif text-4xl leading-none">{note}</span>
        <span class="mt-1.5 text-[10px] uppercase tracking-[.2em] text-brun">Google</span>
      </div>
    </div>
  </div>
</section>
```

<!-- fichier: site/src/components/accueil/Preuves.astro -->
```astro
---
import type { Lang } from '../../lib/i18n';
import { site } from '../../lib/site';
import { t } from '../../i18n/ui';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
const note = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB').format(site.note);
const items = [`${note}/5 · ${site.nbAvis} ${_('avis.avis')} Google`, _('preuves.adresse'), _('preuves.langues'), _('preuves.paiement')];
---
<section aria-label={_('preuves.label')} class="border-y border-encre/10 bg-taupe/50">
  <ul class="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-3 px-5 py-6 text-center text-[11px] uppercase tracking-[.16em] text-encre md:grid-cols-4 md:px-8">
    {items.map((i) => <li>{i}</li>)}
  </ul>
</section>
```

<!-- fichier: site/src/components/accueil/SoinsPhares.astro -->
```astro
---
import { getCollection } from 'astro:content';
import type { Lang } from '../../lib/i18n';
import { aPartirDe } from '../../lib/prix';
import { chemin } from '../../lib/routes';
import { t } from '../../i18n/ui';
import CarteSoin from '../CarteSoin.astro';
import Titre from '../Titre.astro';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
const soins = (await getCollection('soins')).sort((a, b) => a.data.ordre - b.data.ordre);
const phares = soins.filter((s) => s.data.vedette).slice(0, 3);
const autres = soins.filter((s) => !phares.includes(s));
---
<section id="soins" class="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 md:px-8 md:py-28">
  <div class="flex flex-wrap items-end justify-between gap-6">
    <Titre surtitre={_('soins.surtitre')} titre={_('soins.titre')} intro={_('soins.intro')} />
    <a href={chemin('soins', lang)} class="reveal lien-trait hidden text-[12px] uppercase tracking-[.2em] md:inline">{_('soins.voirTout')} <span class="fleche" aria-hidden="true">→</span></a>
  </div>
  <ul class="mt-14 grid gap-14 md:grid-cols-3 md:gap-6">
    {phares.map((s, i) => <li class="reveal" style={`--d:${i * 0.08}s`}><CarteSoin soin={s} lang={lang} /></li>)}
  </ul>
  <ul class="mt-20 border-t border-encre/15">
    {autres.map((s, i) => (
      <li class="reveal" style={`--d:${i * 0.05}s`}>
        <a href={chemin('soin', lang, s.id)} class="group flex items-baseline gap-4 border-b border-encre/15 py-5 transition-colors hover:bg-taupe/30 md:px-3">
          <span class="font-serif text-2xl md:text-3xl">{s.data.titre[lang]}</span>
          <span class="hidden flex-1 -translate-y-1.5 border-b border-dotted border-encre/30 sm:block" aria-hidden="true"></span>
          <span class="ml-auto whitespace-nowrap text-sm text-brun sm:ml-0">{aPartirDe(s.data.tarifs, lang)}</span>
          <span class="fleche text-or-vif" aria-hidden="true">→</span>
        </a>
      </li>
    ))}
  </ul>
  <a href={chemin('soins', lang)} class="mt-10 inline-block border border-encre/25 px-7 py-3.5 text-[12px] uppercase tracking-[.2em] md:hidden">{_('soins.voirTout')} <span class="fleche" aria-hidden="true">→</span></a>
</section>
```

<!-- fichier: site/src/components/accueil/Nocturnes.astro -->
```astro
---
import type { Lang } from '../../lib/i18n';
import { nocturnesAVenir } from '../../lib/nocturnes';
import { site } from '../../lib/site';
import { lienWhatsApp, messageInfo } from '../../lib/whatsapp';
import { t } from '../../i18n/ui';
import Photo from '../Photo.astro';
import Titre from '../Titre.astro';
import haut from '../../assets/photos/cabine-haut.jpg';
import bas from '../../assets/photos/cabine-arche.jpg';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
const avenir = nocturnesAVenir(site.nocturnes, new Date());
const sujet = lang === 'fr' ? 'les prochaines nocturnes' : 'the next late-night evenings';
---
<section class="grain sombre bg-encre py-20 text-creme md:py-28">
  <div class="mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-2">
    <!-- Le sablier de l'affiche, recomposé avec les deux moitiés de la vraie cabine -->
    <div class="reveal relative mx-auto w-full max-w-[420px]">
      <Photo src={haut} alt={_('photo.cabine')} forme="arche-inverse" sizes="420px" widths={[420, 738]} class="aspect-[738/330]" />
      <div class="my-3 h-px bg-or/60" aria-hidden="true"></div>
      <Photo src={bas} alt="" forme="arche" sizes="420px" widths={[420, 740]} class="aspect-[740/347]" />
    </div>
    <div>
      <Titre fond="sombre" surtitre={_('nocturnes.surtitre')} titre={_('nocturnes.titre')} intro={_('nocturnes.texte')} />
      {avenir.length > 0 && (
        <div class="reveal mt-8 border-t border-creme/15 pt-6">
          <p class="surtitre text-or">{_('nocturnes.prochaines')}</p>
          <ul class="mt-4 space-y-3">
            {avenir.map((n) => (
              <li data-fin={n.fin} class="flex items-baseline justify-between gap-4 border-b border-creme/10 pb-3">
                <span class="font-serif text-2xl">{n.quand[lang]}</span>
                <span class="text-sm text-creme/70">{n.heures}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <a href={lienWhatsApp(site.whatsapp, messageInfo(sujet, lang))} target="_blank" rel="noopener" class="reveal mt-9 inline-block bg-or px-8 py-4 text-[12px] uppercase tracking-[.2em] text-encre transition-colors hover:bg-creme" style="--d:.18s">
        {avenir.length ? _('nocturnes.reserver') : _('nocturnes.cta')} <span class="fleche" aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</section>
```

<!-- fichier: site/src/components/accueil/Lieu.astro -->
```astro
---
import type { Lang } from '../../lib/i18n';
import { site } from '../../lib/site';
import { t } from '../../i18n/ui';
import LotusIcone from '../LotusIcone.astro';
import Photo from '../Photo.astro';
import Titre from '../Titre.astro';
import facade from '../../assets/photos/facade.jpg';
import ambiance1 from '../../assets/photos/ambiance-1.jpg';
import ambiance2 from '../../assets/photos/ambiance-2.jpg';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
const note = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB').format(site.note);
---
<section class="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
  <div class="grid items-center gap-14 lg:grid-cols-12">
    <div class="grid grid-cols-2 gap-4 lg:col-span-7">
      <Photo src={facade} alt={_('photo.facade')} class="reveal col-span-2 aspect-[16/7] bg-taupe" imgClass="object-[center_30%]" sizes="(min-width: 1024px) 700px, 100vw" />
      <Photo src={ambiance1} alt={_('photo.ambiance')} forme="arche" class="reveal aspect-[3/4] bg-taupe" sizes="(min-width: 1024px) 340px, 50vw" />
      <Photo src={ambiance2} alt="" forme="arche" class="reveal aspect-[3/4] bg-taupe" sizes="(min-width: 1024px) 340px, 50vw" />
    </div>
    <div class="lg:col-span-5">
      <Titre surtitre={_('lieu.surtitre')} titre={_('lieu.titre')} />
      <ul class="mt-8 space-y-5">
        {(['lieu.p1', 'lieu.p2', 'lieu.p3'] as const).map((cle, i) => (
          <li class="reveal flex gap-4" style={`--d:${0.1 + i * 0.06}s`}>
            <LotusIcone class="mt-1 h-5 w-5 shrink-0 text-or-vif" />
            <p class="leading-relaxed text-brun">{_(cle)}</p>
          </li>
        ))}
      </ul>
      <dl class="reveal mt-10 flex gap-12 border-t border-encre/15 pt-8">
        <div><dt class="sr-only">Google</dt><dd class="font-serif text-5xl leading-none">{note}<span class="text-2xl text-brun">/5</span></dd><dd class="mt-2 text-[11px] uppercase tracking-[.2em] text-brun">Google</dd></div>
        <div><dt class="sr-only">{_('avis.avis')}</dt><dd class="font-serif text-5xl leading-none">{site.nbAvis}</dd><dd class="mt-2 text-[11px] uppercase tracking-[.2em] text-brun">{_('avis.avis')}</dd></div>
      </dl>
    </div>
  </div>
</section>
```

<!-- fichier: site/src/components/accueil/Avis.astro -->
```astro
---
import { getCollection } from 'astro:content';
import type { Lang } from '../../lib/i18n';
import { formaterMois } from '../../lib/horaires';
import { site } from '../../lib/site';
import { t } from '../../i18n/ui';
import Titre from '../Titre.astro';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
// Uniquement des avis Google recopiés mot pour mot (voir content.config.ts).
const avis = (await getCollection('avis')).sort((a, b) => b.data.date.localeCompare(a.data.date)).slice(0, 4);
const note = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB').format(site.note);
const guillemets = (l: Lang, s: string) => (l === 'fr' ? `« ${s} »` : `“${s}”`);
---
<section class="border-t border-encre/10 py-20 md:py-28">
  <div class:list={['mx-auto grid max-w-7xl gap-14 px-5 md:px-8', avis.length && 'lg:grid-cols-12']}>
    <div class:list={[avis.length ? 'lg:col-span-4' : 'text-center']}>
      <Titre surtitre={_('avis.source')} titre={_('avis.titre')} centre={!avis.length} />
      <p class:list={['reveal mt-8 flex items-end gap-3', !avis.length && 'justify-center']}>
        <span class="font-serif text-7xl leading-none">{note}</span>
        <span class="pb-2 text-brun">/ 5 · {site.nbAvis} {_('avis.avis')}</span>
      </p>
      <div class:list={['reveal mt-8 flex flex-wrap gap-3', !avis.length && 'justify-center']}>
        <a href={site.ficheGoogle} target="_blank" rel="noopener" class="bg-encre px-6 py-3.5 text-[12px] uppercase tracking-[.18em] text-creme transition-colors hover:bg-or-profond">{_('avis.voir')} <span class="fleche" aria-hidden="true">→</span></a>
        <a href={site.lienAvisGoogle} target="_blank" rel="noopener" class="border border-encre/25 px-6 py-3.5 text-[12px] uppercase tracking-[.18em] transition-colors hover:border-encre">{_('avis.laisser')}</a>
      </div>
    </div>
    {avis.length > 0 && (
      <ul class="grid gap-5 sm:grid-cols-2 lg:col-span-8">
        {avis.map((a, i) => (
          <li class="reveal flex flex-col bg-white/60 p-7 ring-1 ring-encre/10" style={`--d:${i * 0.07}s`}>
            <p class="tracking-[.15em] text-or-vif" role="img" aria-label={`${a.data.note}/5`}>{'★'.repeat(a.data.note)}</p>
            <blockquote class="mt-4 flex-1 font-serif text-xl italic leading-snug" lang={a.data.langue}>{guillemets(a.data.langue, a.data.texte)}</blockquote>
            <p class="mt-6 text-sm text-brun">{a.data.auteur} · {formaterMois(a.data.date, lang)} · {_('avis.source')}</p>
          </li>
        ))}
      </ul>
    )}
  </div>
</section>
```

<!-- fichier: site/src/components/accueil/Infos.astro -->
```astro
---
import type { Lang } from '../../lib/i18n';
import { formaterPlage, type Jour } from '../../lib/horaires';
import { site, telHref } from '../../lib/site';
import { lienWhatsApp, messageInfo } from '../../lib/whatsapp';
import { t, type Cle } from '../../i18n/ui';
import CarteMaps from '../CarteMaps.astro';
import Titre from '../Titre.astro';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
const jours: Jour[] = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
const itineraire = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.requeteMaps)}`;
---
<section id="infos" class="scroll-mt-20 bg-taupe/50 py-20 md:py-28">
  <div class="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-12">
    <div class="lg:col-span-5">
      <Titre fond="taupe" surtitre={_('infos.surtitre')} titre={_('infos.titre')} />
      <div class="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-1">
        <div class="reveal">
          <h3 class="surtitre text-brun">{_('infos.horaires')}</h3>
          <table class="mt-3 w-full text-[15px]">
            <tbody>
              {jours.map((j) => {
                const plage = site.horaires[j];
                return (
                  <tr class="border-b border-encre/10">
                    <th scope="row" class="py-2 text-left font-normal">{_(`jour.${j}` as Cle)}</th>
                    <td class="py-2 text-right">{plage ? formaterPlage(plage, lang) : _('infos.ferme')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p class="mt-3 text-sm text-brun">{site.noteHoraires[lang]}</p>
        </div>
        <div class="reveal space-y-8">
          <div>
            <h3 class="surtitre text-brun">{_('infos.adresse')}</h3>
            <p class="mt-3 text-[15px]">{site.adresse[lang]}</p>
            <a href={itineraire} target="_blank" rel="noopener" class="lien-trait mt-2 inline-block text-sm">{_('infos.itineraire')} <span class="fleche" aria-hidden="true">→</span></a>
          </div>
          <div>
            <h3 class="surtitre text-brun">{_('contact.titre')}</h3>
            <ul class="mt-3 space-y-1.5 text-[15px]">
              <li><a class="lien-trait" href={telHref()}>{site.telephone}</a></li>
              <li><a class="lien-trait" href={lienWhatsApp(site.whatsapp, messageInfo(undefined, lang))} target="_blank" rel="noopener">WhatsApp</a></li>
              <li><a class="lien-trait" href={`mailto:${site.email}`}>{site.email}</a></li>
            </ul>
          </div>
          <div>
            <h3 class="surtitre text-brun">{_('infos.paiement')}</h3>
            <p class="mt-3 text-[15px]">{_('infos.paiementTexte')}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="reveal lg:col-span-7"><CarteMaps lang={lang} /></div>
  </div>
</section>
```

- [ ] **Step 3 : Page d'accueil et routes**

<!-- fichier: site/src/components/pages/Accueil.astro -->
```astro
---
import type { Lang } from '../../lib/i18n';
import { t } from '../../i18n/ui';
import Base from '../../layouts/Base.astro';
import Hero from '../accueil/Hero.astro';
import Preuves from '../accueil/Preuves.astro';
import SoinsPhares from '../accueil/SoinsPhares.astro';
import Nocturnes from '../accueil/Nocturnes.astro';
import Lieu from '../accueil/Lieu.astro';
import Avis from '../accueil/Avis.astro';
import Infos from '../accueil/Infos.astro';
import Rituels from '../Rituels.astro';
import TeaserCadeau from '../TeaserCadeau.astro';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
---
<Base lang={lang} page="accueil" titre={_('meta.accueil.titre')} description={_('meta.accueil.description')}>
  <Hero lang={lang} />
  <Preuves lang={lang} />
  <SoinsPhares lang={lang} />
  <Rituels lang={lang} />
  <Nocturnes lang={lang} />
  <Lieu lang={lang} />
  <Avis lang={lang} />
  <TeaserCadeau lang={lang} />
  <Infos lang={lang} />
</Base>
```

<!-- fichier: site/src/pages/index.astro -->
```astro
---
import Accueil from '../components/pages/Accueil.astro';
---
<Accueil lang="fr" />
```

<!-- fichier: site/src/pages/en/index.astro -->
```astro
---
import Accueil from '../../components/pages/Accueil.astro';
---
<Accueil lang="en" />
```

- [ ] **Step 4 : Build**

Run: `npm run build`
Expected : « Complete! ». Les liens vers `/soins/…/`, `/reserver/` et `/carte-cadeau/` sont encore cassés : ils sont créés aux Tasks 9 à 11.

- [ ] **Step 5 : Contrôle visuel de l'accueil**

Avec le preview en marche, prendre des captures pleine page de `/` et `/en/` en 390, 820 et 1440 px. Avant chaque capture, forcer les apparitions (`document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible'))`) et faire défiler jusqu'en bas pour charger les images lazy.

Relire chaque capture en vérifiant :
- aucun débordement horizontal ;
- les arches sont propres et aucun coin taupe de l'affiche n'apparaît dans le sablier ;
- l'or est lisible ;
- la page EN est entièrement en anglais ;
- la section avis est cohérente, avec ou sans avis ;
- le hero tient au-dessus de la ligne de flottaison en 1440.

Corriger jusqu'à ce que ce soit impeccable.

- [ ] **Step 6 : Commit**

```bash
git add -A && git commit -m "Accueil FR/EN : hero, soins phares, rituels, nocturnes en sablier, lieu, avis, carte cadeau, infos"
```

---

### Task 9 : Pages soins et données structurées (TDD sur `schema-org.ts`)

**Files :**
- Create: `site/src/lib/schema-org.ts`, `site/src/lib/schema-org.test.ts`
- Create: `site/src/components/pages/ListeSoins.astro`, `site/src/components/pages/FicheSoin.astro`
- Create: `site/src/pages/soins/index.astro`, `site/src/pages/soins/[slug].astro`, `site/src/pages/en/treatments/index.astro`, `site/src/pages/en/treatments/[slug].astro`
- Modify: `site/src/components/pages/Accueil.astro` (ajout du schéma `DaySpa`)

**Interfaces :**
- Consumes : `Site` (Task 6), `Tarif`, `nomTarif` (Task 2), `chemin` (Task 2), `Jour` (Task 3).
- Produces :
  - `schemaEtablissement(site: Site, lang: Lang, base: string, image: string): object` ;
  - `schemaService(soin: { id: string; titre: Texte; description: Texte; tarifs: Tarif[] }, site: Site, lang: Lang, base: string, image: string): object` ;
  - `schemaFAQ(faq: { q: Texte; r: Texte }[], lang: Lang): object | null` ;
  - `schemaFilAriane(etapes: { nom: string; url: string }[]): object`.

- [ ] **Step 1 : Tests (échouent)**

<!-- fichier: site/src/lib/schema-org.test.ts -->
```ts
import { describe, expect, it } from 'vitest';
import { schemaEtablissement, schemaFAQ, schemaFilAriane, schemaService } from './schema-org';
import { site } from './site';

const BASE = 'https://medi-spa-saly.sn/';
const soin = {
  id: 'massage-saly',
  titre: { fr: 'Massages', en: 'Massages' },
  description: { fr: 'Desc', en: 'Desc' },
  tarifs: [{ prix: 20000, duree: '60 min' }, { prix: null, libelle: { fr: 'Sur mesure', en: 'Custom' } }, { prix: 0, libelle: { fr: 'Bilan', en: 'Assessment' } }],
};

describe('schemaEtablissement', () => {
  const s = schemaEtablissement({ ...site, facebook: undefined }, 'fr', BASE, 'https://x/img.jpg') as any;
  it('déclare un DaySpa avec un @id stable, sans double barre oblique', () => {
    expect(s['@type']).toBe('DaySpa');
    expect(s['@id']).toBe('https://medi-spa-saly.sn/#spa');
  });
  it('regroupe les jours aux mêmes horaires et ignore les jours fermés', () => {
    expect(s.openingHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '09:00', closes: '20:00' },
    ]);
  });
  it('n’inclut pas de réseau absent dans sameAs', () => {
    expect(s.sameAs).toEqual([site.instagram]);
  });
  it('déclare la note Google', () => {
    expect(s.aggregateRating).toMatchObject({ ratingValue: site.note, reviewCount: site.nbAvis, bestRating: 5 });
  });
});

describe('schemaService', () => {
  it('n’expose aucun prix en mode démo', () => {
    const s = schemaService(soin, { ...site, demo: true }, 'fr', BASE, 'https://x/img.jpg') as any;
    expect(s).not.toHaveProperty('offers');
    expect(s.provider).toEqual({ '@id': 'https://medi-spa-saly.sn/#spa' });
    expect(s.url).toBe('https://medi-spa-saly.sn/soins/massage-saly/');
  });
  it('expose les tarifs chiffrés en production, en XOF, sans les « sur devis »', () => {
    const s = schemaService(soin, { ...site, demo: false }, 'en', BASE, 'https://x/img.jpg') as any;
    expect(s.url).toBe('https://medi-spa-saly.sn/en/treatments/massage-saly/');
    expect(s.offers).toEqual([
      { '@type': 'Offer', name: '60 min', price: 20000, priceCurrency: 'XOF' },
      { '@type': 'Offer', name: 'Assessment', price: 0, priceCurrency: 'XOF' },
    ]);
  });
});

describe('schemaFAQ', () => {
  it('renvoie null sans question', () => {
    expect(schemaFAQ([], 'fr')).toBeNull();
  });
  it('construit une FAQPage dans la langue demandée', () => {
    const s = schemaFAQ([{ q: { fr: 'Q ?', en: 'Q?' }, r: { fr: 'R.', en: 'A.' } }], 'en') as any;
    expect(s.mainEntity).toEqual([{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } }]);
  });
});

describe('schemaFilAriane', () => {
  it('numérote les étapes à partir de 1', () => {
    const s = schemaFilAriane([{ nom: 'Accueil', url: 'https://a/' }, { nom: 'Soins', url: 'https://a/soins/' }]) as any;
    expect(s.itemListElement.map((e: any) => e.position)).toEqual([1, 2]);
    expect(s.itemListElement[1]).toMatchObject({ name: 'Soins', item: 'https://a/soins/' });
  });
});
```

Run: `npm test` → Expected : FAIL (`./schema-org` introuvable).

- [ ] **Step 2 : Implémentation**

<!-- fichier: site/src/lib/schema-org.ts -->
```ts
import type { Jour } from './horaires';
import type { Lang, Texte } from './i18n';
import { nomTarif, type Tarif } from './prix';
import { chemin } from './routes';
import type { Site } from './site';

const JOURS: Record<Jour, string> = { lun: 'Monday', mar: 'Tuesday', mer: 'Wednesday', jeu: 'Thursday', ven: 'Friday', sam: 'Saturday', dim: 'Sunday' };
const ORDRE: Jour[] = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
const racine = (base: string) => base.replace(/\/$/, '');

export function schemaEtablissement(site: Site, lang: Lang, base: string, image: string) {
  const groupes = new Map<string, string[]>();
  for (const jour of ORDRE) {
    const plage = site.horaires[jour];
    if (!plage) continue;
    const cle = plage.join('|');
    groupes.set(cle, [...(groupes.get(cle) ?? []), JOURS[jour]]);
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'DaySpa',
    '@id': `${racine(base)}/#spa`,
    name: site.nom,
    url: new URL(chemin('accueil', lang), base).href,
    image,
    telephone: site.telephone,
    email: site.email,
    address: { '@type': 'PostalAddress', streetAddress: site.rue, addressLocality: site.ville, addressCountry: 'SN' },
    openingHoursSpecification: [...groupes].map(([cle, jours]) => {
      const [opens, closes] = cle.split('|');
      return { '@type': 'OpeningHoursSpecification', dayOfWeek: jours, opens, closes };
    }),
    aggregateRating: { '@type': 'AggregateRating', ratingValue: site.note, reviewCount: site.nbAvis, bestRating: 5 },
    currenciesAccepted: 'XOF',
    paymentAccepted: 'Cash, Wave, Orange Money',
    availableLanguage: ['fr', 'en'],
    sameAs: [site.instagram, site.facebook].filter((u): u is string => Boolean(u)),
  };
}

export function schemaService(
  soin: { id: string; titre: Texte; description: Texte; tarifs: Tarif[] },
  site: Site,
  lang: Lang,
  base: string,
  image: string,
) {
  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: soin.titre[lang],
    description: soin.description[lang],
    url: new URL(chemin('soin', lang, soin.id), base).href,
    image,
    provider: { '@id': `${racine(base)}/#spa` },
    areaServed: { '@type': 'City', name: site.ville },
  };
  // En démo, les prix sont indicatifs : on ne les publie pas aux moteurs de recherche.
  if (site.demo) return service;
  const offers = soin.tarifs
    .filter((t) => t.prix !== null)
    .map((t) => ({ '@type': 'Offer', name: nomTarif(t, lang), price: t.prix, priceCurrency: 'XOF' }));
  return { ...service, offers };
}

export function schemaFAQ(faq: { q: Texte; r: Texte }[], lang: Lang) {
  if (!faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q[lang], acceptedAnswer: { '@type': 'Answer', text: f.r[lang] } })),
  };
}

export function schemaFilAriane(etapes: { nom: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: etapes.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.nom, item: e.url })),
  };
}
```

Run: `npm test` → Expected : PASS (9 fichiers de test).

- [ ] **Step 3 : Schéma `DaySpa` sur l'accueil**

Dans `site/src/components/pages/Accueil.astro`, ajouter aux imports :

```ts
import { getImage } from 'astro:assets';
import { schemaEtablissement } from '../../lib/schema-org';
import { site } from '../../lib/site';
import hero from '../../assets/photos/hero.jpg';
```

puis, après `const _ = t(lang);` :

```ts
const base = Astro.site!.href;
const image = new URL((await getImage({ src: hero, width: 1200, format: 'jpg' })).src, base).href;
const schemas = [schemaEtablissement(site, lang, base, image)];
```

et passer `schemas={schemas}` au composant `<Base …>`.

- [ ] **Step 4 : Liste des soins**

<!-- fichier: site/src/components/pages/ListeSoins.astro -->
```astro
---
import { getCollection } from 'astro:content';
import type { Lang } from '../../lib/i18n';
import { chemin } from '../../lib/routes';
import { schemaFilAriane } from '../../lib/schema-org';
import { t, type Cle } from '../../i18n/ui';
import Base from '../../layouts/Base.astro';
import CarteSoin from '../CarteSoin.astro';
import FilAriane from '../FilAriane.astro';
import Rituels from '../Rituels.astro';
import TeaserCadeau from '../TeaserCadeau.astro';
import Titre from '../Titre.astro';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
const soins = (await getCollection('soins')).sort((a, b) => a.data.ordre - b.data.ordre);
const categories = [...new Set(soins.map((s) => s.data.categorie))];
const base = Astro.site!.href;
const etapes = [
  { nom: _('fil.accueil'), href: chemin('accueil', lang) },
  { nom: _('soins.titre'), href: chemin('soins', lang) },
];
const schemas = [schemaFilAriane(etapes.map((e) => ({ nom: e.nom, url: new URL(e.href, base).href })))];
---
<Base lang={lang} page="soins" titre={_('meta.soins.titre')} description={_('meta.soins.description')} schemas={schemas}>
  <section class="mx-auto max-w-7xl px-5 pb-20 pt-8 md:px-8 md:pb-28 md:pt-12">
    <FilAriane lang={lang} etapes={etapes} />
    <Titre niveau="h1" class="mt-8" surtitre={_('soins.surtitre')} titre={_('soins.titre')} intro={_('soins.intro')} />
    <div data-filtres hidden role="group" aria-label={_('soins.filtrer')} class="mt-10 flex flex-wrap gap-2">
      <button type="button" data-cat="tous" aria-pressed="true" class="pastille px-4 py-2 text-[13px] aria-pressed:border-encre aria-pressed:bg-encre aria-pressed:text-creme">{_('soins.tous')}</button>
      {categories.map((c) => (
        <button type="button" data-cat={c} aria-pressed="false" class="pastille px-4 py-2 text-[13px] aria-pressed:border-encre aria-pressed:bg-encre aria-pressed:text-creme">{_(`cat.${c}` as Cle)}</button>
      ))}
    </div>
    <ul class="mt-12 grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
      {soins.map((s, i) => <li data-categorie={s.data.categorie} class="reveal" style={`--d:${(i % 3) * 0.08}s`}><CarteSoin soin={s} lang={lang} titre="h2" /></li>)}
    </ul>
  </section>
  <Rituels lang={lang} />
  <TeaserCadeau lang={lang} />
</Base>

<script>
  // Filtres par catégorie : amélioration progressive, sans JS toute la carte reste visible.
  const zone = document.querySelector<HTMLElement>('[data-filtres]');
  if (zone) {
    zone.hidden = false;
    const boutons = [...zone.querySelectorAll<HTMLButtonElement>('button')];
    const cartes = [...document.querySelectorAll<HTMLElement>('[data-categorie]')];
    zone.addEventListener('click', (e) => {
      const bouton = (e.target as Element).closest('button');
      if (!bouton) return;
      const cat = bouton.dataset.cat;
      boutons.forEach((b) => b.setAttribute('aria-pressed', String(b === bouton)));
      cartes.forEach((c) => (c.hidden = cat !== 'tous' && c.dataset.categorie !== cat));
    });
  }
</script>
```

- [ ] **Step 5 : Fiche soin**

<!-- fichier: site/src/components/pages/FicheSoin.astro -->
```astro
---
import { getCollection, type CollectionEntry } from 'astro:content';
import { getImage } from 'astro:assets';
import type { Lang } from '../../lib/i18n';
import { aPartirDe, formaterPrix, nomTarif } from '../../lib/prix';
import { chemin } from '../../lib/routes';
import { schemaFAQ, schemaFilAriane, schemaService } from '../../lib/schema-org';
import { site } from '../../lib/site';
import { lienWhatsApp, messageInfo } from '../../lib/whatsapp';
import { t, type Cle } from '../../i18n/ui';
import Base from '../../layouts/Base.astro';
import CarteSoin from '../CarteSoin.astro';
import FilAriane from '../FilAriane.astro';
import LotusIcone from '../LotusIcone.astro';
import Photo from '../Photo.astro';

interface Props { lang: Lang; soin: CollectionEntry<'soins'> }
const { lang, soin } = Astro.props;
const _ = t(lang);
const d = soin.data;
const base = Astro.site!.href;
const reserver = `${chemin('reserver', lang)}?soin=${soin.id}`;

// « Vous aimerez aussi » : même catégorie d'abord, puis les soins vedettes, puis l'ordre de la carte.
const autres = (await getCollection('soins'))
  .filter((s) => s.id !== soin.id)
  .sort((a, b) => Number(b.data.categorie === d.categorie) - Number(a.data.categorie === d.categorie) || Number(b.data.vedette) - Number(a.data.vedette) || a.data.ordre - b.data.ordre)
  .slice(0, 3);

const etapes = [
  { nom: _('fil.accueil'), href: chemin('accueil', lang) },
  { nom: _('soins.titre'), href: chemin('soins', lang) },
  { nom: d.titre[lang], href: chemin('soin', lang, soin.id) },
];
const image = new URL((await getImage({ src: d.image, width: 1200, format: 'jpg' })).src, base).href;
const schemas = [
  schemaService({ id: soin.id, ...d }, site, lang, base, image),
  schemaFAQ(d.faq, lang),
  schemaFilAriane(etapes.map((e) => ({ nom: e.nom, url: new URL(e.href, base).href }))),
].filter((s): s is object => s !== null);
---
<Base lang={lang} page="soin" slug={soin.id} titre={d.seo.titre[lang]} description={d.seo.description[lang]} image={d.image} schemas={schemas}>
  <section class="mx-auto max-w-7xl px-5 pt-8 md:px-8 md:pt-12">
    <FilAriane lang={lang} etapes={etapes} />
    <div class="mt-8 grid items-center gap-12 pb-4 lg:grid-cols-12">
      <div class="lg:col-span-6">
        <p class="surtitre text-or-profond">{_(`cat.${d.categorie}` as Cle)}</p>
        <h1 class="mt-4 text-5xl leading-[1] md:text-7xl">{d.titre[lang]}</h1>
        <p class="mt-6 font-serif text-2xl italic leading-snug text-brun md:text-3xl">{d.accroche[lang]}</p>
        <p class="mt-6 max-w-xl leading-relaxed">{d.description[lang]}</p>
        <div class="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
          <a href={reserver} class="bg-encre px-8 py-4 text-[12px] uppercase tracking-[.2em] text-creme transition-colors hover:bg-or-profond">{_('fiche.reserver')} <span class="fleche" aria-hidden="true">→</span></a>
          <a href={lienWhatsApp(site.whatsapp, messageInfo(d.titre[lang], lang))} target="_blank" rel="noopener" class="lien-trait text-sm">{_('fiche.question')}</a>
        </div>
        <p class="mt-6 text-sm text-brun">{aPartirDe(d.tarifs, lang)}</p>
      </div>
      <div class="lg:col-span-6">
        <Photo src={d.image} alt={d.imageAlt[lang]} forme="arche" prioritaire sizes="(min-width: 1024px) 520px, 100vw" class="mx-auto aspect-[5/6] w-full max-w-[520px] bg-taupe" />
      </div>
    </div>
  </section>

  <section class="mx-auto grid max-w-7xl gap-16 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2">
    <div>
      <h2 class="reveal text-4xl md:text-5xl">{_('fiche.deroule')}</h2>
      <ol class="mt-10 space-y-7">
        {d.deroule[lang].map((e, i) => (
          <li class="reveal flex gap-6" style={`--d:${i * 0.06}s`}>
            <span class="font-serif text-4xl leading-none text-or-vif" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <p class="pt-1 text-lg leading-relaxed">{e}</p>
          </li>
        ))}
      </ol>
    </div>
    <div>
      <h2 class="reveal text-4xl md:text-5xl">{_('fiche.bienfaits')}</h2>
      <ul class="mt-10 space-y-5">
        {d.bienfaits[lang].map((b, i) => (
          <li class="reveal flex gap-4 border-b border-encre/10 pb-5" style={`--d:${i * 0.06}s`}>
            <LotusIcone class="mt-1 h-5 w-5 shrink-0 text-or-vif" />
            <span class="text-lg">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>

  <section class="bg-taupe py-20 md:py-24">
    <div class="mx-auto max-w-3xl px-5 md:px-8">
      <h2 class="reveal text-center text-4xl md:text-5xl">{_('fiche.tarifs')}</h2>
      <ul class="mt-10 border-t border-encre/20">
        {d.tarifs.map((tarif) => (
          <li class="reveal flex items-baseline gap-4 border-b border-encre/20 py-5">
            <span class="font-serif text-xl md:text-2xl">{nomTarif(tarif, lang)}</span>
            <span class="hidden flex-1 -translate-y-1.5 border-b border-dotted border-encre/30 sm:block" aria-hidden="true"></span>
            <span class="ml-auto whitespace-nowrap sm:ml-0">{formaterPrix(tarif.prix, lang)}</span>
          </li>
        ))}
      </ul>
      {site.demo && <p class="mt-4 text-center text-xs text-brun">{_('demo.bandeau')}</p>}
      <div class="mt-10 text-center">
        <a href={reserver} class="inline-block bg-encre px-8 py-4 text-[12px] uppercase tracking-[.2em] text-creme transition-colors hover:bg-or-profond">{_('fiche.reserver')} <span class="fleche" aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>

  {d.faq.length > 0 && (
    <section class="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-24">
      <h2 class="reveal text-center text-4xl md:text-5xl">{_('fiche.faq')}</h2>
      <div class="mt-10 space-y-3">
        {d.faq.map((f) => (
          <details class="reveal group border border-encre/10 bg-white/50 px-6 py-5">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl">
              {f.q[lang]}
              <span class="text-2xl leading-none text-or-vif transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p class="mt-3 leading-relaxed text-brun">{f.r[lang]}</p>
          </details>
        ))}
      </div>
    </section>
  )}

  <section class="border-t border-encre/10">
    <div class="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
      <h2 class="reveal text-4xl md:text-5xl">{_('fiche.autres')}</h2>
      <ul class="mt-12 grid gap-14 md:grid-cols-3 md:gap-6">
        {autres.map((s, i) => <li class="reveal" style={`--d:${i * 0.08}s`}><CarteSoin soin={s} lang={lang} /></li>)}
      </ul>
    </div>
  </section>
</Base>
```

- [ ] **Step 6 : Routes FR/EN**

<!-- fichier: site/src/pages/soins/index.astro -->
```astro
---
import ListeSoins from '../../components/pages/ListeSoins.astro';
---
<ListeSoins lang="fr" />
```

<!-- fichier: site/src/pages/soins/[slug].astro -->
```astro
---
import { getCollection } from 'astro:content';
import FicheSoin from '../../components/pages/FicheSoin.astro';

export async function getStaticPaths() {
  const soins = await getCollection('soins');
  return soins.map((soin) => ({ params: { slug: soin.id }, props: { soin } }));
}
const { soin } = Astro.props;
---
<FicheSoin lang="fr" soin={soin} />
```

<!-- fichier: site/src/pages/en/treatments/index.astro -->
```astro
---
import ListeSoins from '../../../components/pages/ListeSoins.astro';
---
<ListeSoins lang="en" />
```

<!-- fichier: site/src/pages/en/treatments/[slug].astro -->
```astro
---
import { getCollection } from 'astro:content';
import FicheSoin from '../../../components/pages/FicheSoin.astro';

export async function getStaticPaths() {
  const soins = await getCollection('soins');
  return soins.map((soin) => ({ params: { slug: soin.id }, props: { soin } }));
}
const { soin } = Astro.props;
---
<FicheSoin lang="en" soin={soin} />
```

- [ ] **Step 7 : Build et contrôles**

Run:

```bash
npm run build && ls dist/soins dist/en/treatments && grep -c '"@type":"Service"' dist/soins/massage-saly/index.html && grep -c '"offers"' dist/soins/massage-saly/index.html
```

Expected :
- 7 dossiers de soin dans chaque liste ;
- `1` pour Service ;
- `0` pour offers (mode démo). `grep -c` renvoie alors un code de sortie 1 : c'est le résultat attendu.

- [ ] **Step 8 : Contrôle visuel**

Captures de `/soins/`, `/soins/massage-saly/`, `/soins/kinesitherapie-saly/` (cas « sur devis ») et `/en/treatments/epilation-saly/` (tarifs sans durée), en 390 et 1440 px.

Vérifier :
- la grille de tarifs est lisible à 390 px ;
- la FAQ s'ouvre ;
- les filtres de `/soins/` masquent et affichent correctement (cliquer « Rituels d'eau », puis « Tous ») ;
- le sélecteur de langue d'une fiche mène à la fiche équivalente.

Corriger.

- [ ] **Step 9 : Commit**

```bash
git add -A && git commit -m "Pages soins FR/EN : liste filtrable, 7 fiches, Schema.org Service/FAQ/fil d'Ariane (sans prix en démo)"
```

---

### Task 10 : Réservation guidée

**Files :**
- Create: `site/src/components/pages/Reserver.astro`, `site/src/scripts/reservation.ts`
- Create: `site/src/pages/reserver.astro`, `site/src/pages/en/book.astro`

**Interfaces :**
- Consumes : `prochainsJours`, `formaterJourCourt`, `formaterJour`, `Creneau`, `CRENEAUX`, `Horaires` (Task 3) ; `lienWhatsApp`, `messageReservation` (Task 4) ; `nomTarif`, `formaterPrix` (Task 2) ; collections `soins` et `rituels` (Task 6).
- Produces :
  - la page `/reserver/?soin=<id>`, qui accepte un id de soin ou de rituel ;
  - le contrat JSON `#donnees-resa` : `{ lang, whatsapp, horaires, options: { id, titre, formules: { nom, prix: string | null }[] }[], textes: { indispo, erreurs: { soin, formule, jour, creneau, prenom } } }`.

- [ ] **Step 1 : La page**

<!-- fichier: site/src/components/pages/Reserver.astro -->
```astro
---
import { getCollection } from 'astro:content';
import type { Lang } from '../../lib/i18n';
import { CRENEAUX } from '../../lib/horaires';
import { formaterPrix, nomTarif } from '../../lib/prix';
import { chemin } from '../../lib/routes';
import { site } from '../../lib/site';
import { lienWhatsApp, messageInfo } from '../../lib/whatsapp';
import { t, type Cle } from '../../i18n/ui';
import Base from '../../layouts/Base.astro';
import FilAriane from '../FilAriane.astro';
import Titre from '../Titre.astro';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
const soins = (await getCollection('soins')).sort((a, b) => a.data.ordre - b.data.ordre);
const rituels = (await getCollection('rituels')).sort((a, b) => a.data.ordre - b.data.ordre);

// Un prix nul (bilan offert) s'affiche « Offert » ; un prix absent (sur devis) n'est pas cité.
const optionsSoins = soins.map((s) => ({
  id: s.id,
  titre: s.data.titre[lang],
  formules: s.data.tarifs.map((tarif) => ({ nom: nomTarif(tarif, lang), prix: tarif.prix === null ? null : formaterPrix(tarif.prix, lang) })),
}));
const optionsRituels = rituels.map((r) => ({
  id: r.id,
  titre: r.data.nom[lang],
  formules: [{ nom: r.data.duree, prix: r.data.prix === null ? null : formaterPrix(r.data.prix, lang) }],
}));
const donnees = {
  lang,
  whatsapp: site.whatsapp,
  horaires: site.horaires,
  options: [...optionsSoins, ...optionsRituels],
  textes: {
    indispo: _('resa.indispo'),
    erreurs: { soin: _('resa.erreur.soin'), formule: _('resa.erreur.formule'), jour: _('resa.erreur.jour'), creneau: _('resa.erreur.creneau'), prenom: _('resa.erreur.prenom') },
  },
};
const etapes = [
  { nom: _('fil.accueil'), href: chemin('accueil', lang) },
  { nom: _('resa.titre'), href: chemin('reserver', lang) },
];
const legende = 'font-serif text-2xl md:text-3xl';
const numero = 'mr-3 font-sans text-sm text-or-profond';
---
<Base lang={lang} page="reserver" titre={_('meta.reserver.titre')} description={_('meta.reserver.description')}>
  <section class="mx-auto max-w-7xl px-5 pb-24 pt-8 md:px-8 md:pt-12">
    <FilAriane lang={lang} etapes={etapes} />
    <Titre niveau="h1" class="mt-8" surtitre={_('resa.surtitre')} titre={_('resa.titre')} intro={_('resa.intro')} />

    <p id="resa-sans-js" class="mt-10 max-w-xl text-brun">
      {_('resa.sansJs')}
      <a class="lien-trait font-medium text-encre" href={lienWhatsApp(site.whatsapp, messageInfo(undefined, lang))}>WhatsApp</a>
    </p>

    <form id="form-resa" hidden novalidate class="mt-14 grid gap-12 lg:grid-cols-12">
      <div class="space-y-14 lg:col-span-8">
        <fieldset>
          <legend class={legende}><span class={numero}>01</span>{_('resa.etape1')}</legend>
          <div class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {optionsSoins.map((o) => <label class="pastille"><input type="radio" name="soin" value={o.id} class="sr-only" />{o.titre}</label>)}
          </div>
          <p class="surtitre mt-8 text-brun">{_('rituels.titre')}</p>
          <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {optionsRituels.map((o) => <label class="pastille"><input type="radio" name="soin" value={o.id} class="sr-only" />{o.titre}</label>)}
          </div>
        </fieldset>

        <fieldset>
          <legend class={legende}><span class={numero}>02</span>{_('resa.etape2')}</legend>
          <div id="formules" class="mt-6 grid gap-2 sm:grid-cols-2"></div>
        </fieldset>

        <fieldset>
          <legend class={legende}><span class={numero}>03</span>{_('resa.etape3')}</legend>
          <div id="jours" class="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:px-0"></div>
          <p class="mt-3 text-sm text-brun">{_('resa.dimanche')}</p>
        </fieldset>

        <fieldset>
          <legend class={legende}><span class={numero}>04</span>{_('resa.etape4')}</legend>
          <div class="mt-6 grid grid-cols-3 gap-2">
            {CRENEAUX.map((c) => <label class="pastille"><input type="radio" name="creneau" value={c} class="sr-only" disabled />{_(`creneau.${c}` as Cle)}</label>)}
          </div>
          <label for="prenom" class="surtitre mt-10 block text-brun">{_('resa.prenom')}</label>
          <input id="prenom" name="prenom" autocomplete="given-name" maxlength="60" class="mt-3 w-full border border-encre/25 bg-white/70 px-4 py-3.5 text-lg outline-none transition-colors focus:border-encre" />
        </fieldset>
      </div>

      <aside class="lg:col-span-4">
        <div class="grain sombre sticky top-24 bg-encre p-8 text-creme">
          <p class="surtitre text-or">{_('resa.recap')}</p>
          <dl class="mt-6 space-y-4 text-[15px]">
            <div><dt class="text-xs uppercase tracking-[.16em] text-creme/60">{_('resa.etape1')}</dt><dd id="recap-soin" class="mt-1 font-serif text-2xl">—</dd></div>
            <div><dt class="text-xs uppercase tracking-[.16em] text-creme/60">{_('resa.etape2')}</dt><dd id="recap-formule" class="mt-1">—</dd></div>
            <div><dt class="text-xs uppercase tracking-[.16em] text-creme/60">{_('resa.etape3')}</dt><dd id="recap-jour" class="mt-1">—</dd></div>
            <div><dt class="text-xs uppercase tracking-[.16em] text-creme/60">{_('resa.etape4')}</dt><dd id="recap-creneau" class="mt-1">—</dd></div>
          </dl>
          <p id="erreur-resa" role="alert" class="mt-6 min-h-[1.5em] text-sm text-or"></p>
          <button type="submit" class="mt-2 w-full bg-or py-4 text-[12px] uppercase tracking-[.2em] text-encre transition-colors hover:bg-creme">{_('resa.envoyer')} <span class="fleche" aria-hidden="true">→</span></button>
          <p class="mt-4 text-xs leading-relaxed text-creme/70">{_('resa.apres')}</p>
        </div>
      </aside>
    </form>
  </section>
  <script id="donnees-resa" type="application/json" set:html={JSON.stringify(donnees)} />
</Base>

<script>
  import '../../scripts/reservation';
</script>
```

- [ ] **Step 2 : Le script**

<!-- fichier: site/src/scripts/reservation.ts -->
```ts
import { formaterJour, formaterJourCourt, prochainsJours, type Creneau, type Horaires } from '../lib/horaires';
import type { Lang } from '../lib/i18n';
import { lienWhatsApp, messageReservation } from '../lib/whatsapp';

type Formule = { nom: string; prix: string | null };
type Option = { id: string; titre: string; formules: Formule[] };
type Champ = 'soin' | 'formule' | 'jour' | 'creneau' | 'prenom';
type Donnees = { lang: Lang; whatsapp: string; horaires: Horaires; options: Option[]; textes: { indispo: string; erreurs: Record<Champ, string> } };

const form = document.querySelector<HTMLFormElement>('#form-resa');
const brut = document.querySelector('#donnees-resa')?.textContent;
if (form && brut) initialiser(form, JSON.parse(brut) as Donnees);

function pastille(nom: string, valeur: string, contenu: (HTMLElement | string)[], desactive = false, classe = 'pastille') {
  const label = document.createElement('label');
  label.className = classe;
  const input = document.createElement('input');
  Object.assign(input, { type: 'radio', name: nom, value: valeur, className: 'sr-only', disabled: desactive });
  label.append(input, ...contenu);
  return label;
}

function span(texte: string, classe: string) {
  const s = document.createElement('span');
  s.className = classe;
  s.textContent = texte;
  return s;
}

function initialiser(form: HTMLFormElement, d: Donnees) {
  form.hidden = false;
  document.querySelector('#resa-sans-js')?.remove();

  const zoneFormules = form.querySelector<HTMLElement>('#formules')!;
  const zoneJours = form.querySelector<HTMLElement>('#jours')!;
  const erreur = form.querySelector<HTMLElement>('#erreur-resa')!;
  const recap = (id: string) => form.querySelector<HTMLElement>(`#recap-${id}`)!;
  const creneaux = [...form.querySelectorAll<HTMLInputElement>('input[name="creneau"]')];
  const valeur = (nom: string) => (form.querySelector<HTMLInputElement>(`input[name="${nom}"]:checked`)?.value ?? null);
  const jours = prochainsJours(new Date(), d.horaires);

  zoneJours.replaceChildren(
    ...jours.map(({ iso, date, creneaux: dispo }) => {
      const c = formaterJourCourt(date, d.lang);
      const el = pastille('jour', iso, [span(c.jour, 'text-[11px] uppercase tracking-[.12em]'), span(c.num, 'font-serif text-2xl leading-none'), span(c.mois, 'text-[11px]')], dispo.length === 0, 'pastille pastille-jour');
      if (!dispo.length) el.title = d.textes.indispo;
      return el;
    }),
  );

  const optionChoisie = () => d.options.find((o) => o.id === valeur('soin'));

  function afficherFormules() {
    const option = optionChoisie();
    zoneFormules.replaceChildren(
      ...(option?.formules ?? []).map((f, i) =>
        pastille('formule', String(i), [span(f.nom, ''), ...(f.prix ? [span(f.prix, 'text-sm opacity-70')] : [])], false, 'pastille justify-between text-left'),
      ),
    );
    if (option?.formules.length === 1) zoneFormules.querySelector<HTMLInputElement>('input')!.checked = true;
  }

  function majCreneaux() {
    const dispo = jours.find((j) => j.iso === valeur('jour'))?.creneaux ?? [];
    for (const input of creneaux) {
      input.disabled = !dispo.includes(input.value as Creneau);
      if (input.disabled) input.checked = false;
    }
  }

  function majRecap() {
    const option = optionChoisie();
    const formule = option?.formules[Number(valeur('formule'))];
    const iso = valeur('jour');
    recap('soin').textContent = option?.titre ?? '—';
    recap('formule').textContent = formule ? [formule.nom, formule.prix].filter(Boolean).join(' · ') : '—';
    recap('jour').textContent = iso ? formaterJour(new Date(`${iso}T00:00:00Z`), d.lang) : '—';
    recap('creneau').textContent = form.querySelector<HTMLInputElement>('input[name="creneau"]:checked')?.parentElement?.textContent?.trim() ?? '—';
  }

  form.addEventListener('change', (e) => {
    const nom = (e.target as HTMLInputElement).name;
    if (nom === 'soin') afficherFormules();
    if (nom === 'jour') majCreneaux();
    erreur.textContent = '';
    majRecap();
  });

  // Présélection depuis une fiche soin ou un rituel : /reserver/?soin=massage-saly
  const preselection = new URLSearchParams(location.search).get('soin');
  const radio = [...form.querySelectorAll<HTMLInputElement>('input[name="soin"]')].find((r) => r.value === preselection);
  if (radio) {
    radio.checked = true;
    afficherFormules();
    majRecap();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const option = optionChoisie();
    const indexFormule = valeur('formule');
    const iso = valeur('jour');
    const creneau = valeur('creneau') as Creneau | null;
    const prenom = form.querySelector<HTMLInputElement>('#prenom')!.value.trim();
    const manque: Champ | null = !option ? 'soin' : indexFormule === null ? 'formule' : !iso ? 'jour' : !creneau ? 'creneau' : !prenom ? 'prenom' : null;
    if (manque) {
      erreur.textContent = d.textes.erreurs[manque];
      const cible = manque === 'prenom' ? form.querySelector<HTMLElement>('#prenom') : form.querySelector<HTMLElement>(`input[name="${manque}"]:not(:disabled)`);
      cible?.focus();
      return;
    }
    const formule = option!.formules[Number(indexFormule)];
    const message = messageReservation(
      { soin: option!.titre, formule: formule.nom || undefined, prix: formule.prix ?? undefined, jour: new Date(`${iso}T00:00:00Z`), creneau: creneau!, prenom },
      d.lang,
    );
    const lien = lienWhatsApp(d.whatsapp, message);
    const fenetre = window.open(lien, '_blank');
    if (fenetre) fenetre.opener = null;
    else location.href = lien;
  });
}
```

<!-- fichier: site/src/pages/reserver.astro -->
```astro
---
import Reserver from '../components/pages/Reserver.astro';
---
<Reserver lang="fr" />
```

<!-- fichier: site/src/pages/en/book.astro -->
```astro
---
import Reserver from '../../components/pages/Reserver.astro';
---
<Reserver lang="en" />
```

- [ ] **Step 3 : Build**

Run: `npm run build && npm test`
Expected : build « Complete! » avec `dist/reserver/index.html` et `dist/en/book/index.html` ; tests PASS.

- [ ] **Step 4 : Test du parcours dans le navigateur (Playwright, preview en marche)**

1. Ouvrir `http://localhost:4321/reserver/?soin=massage-saly`. Vérifier que « Massages » est coché et que 5 formules s'affichent.
2. Intercepter `window.open`. Via `browser_evaluate` : `window.__liens = []; window.open = (u) => { window.__liens.push(u); return {}; }`.
3. Cliquer « Envoyer sur WhatsApp » sans rien d'autre. Attendu : `#erreur-resa` = « Choisissez une formule. ».
4. Choisir « Relaxant · 60 min », le premier jour disponible et « Après-midi », puis saisir le prénom « Aïssatou ». Envoyer.
5. Lire `window.__liens[0]` et décoder le paramètre `text`. Il doit contenir :
   - `Je souhaite réserver : Massages — Relaxant · 60 min (20 000 FCFA)` ;
   - la date du jour choisi en toutes lettres ;
   - `l'après-midi` ;
   - `Prénom : Aïssatou`.
6. Ouvrir `/en/book/?soin=kinesitherapie-saly`, puis choisir un jour et un moment. Le message doit être en anglais, sans prix ni « () ».
7. Vérifier que le dimanche est désactivé et que la pastille du jour ne présente plus de créneau passé.
8. Captures en 390 et 1440 px (formulaire partiellement rempli).

- [ ] **Step 5 : Commit**

```bash
git add -A && git commit -m "Réservation guidée : soin, formule, jour, moment, prénom, puis message WhatsApp complet"
```

---

### Task 11 : Carte cadeau

**Files :**
- Create: `site/src/components/pages/CarteCadeau.astro`, `site/src/scripts/carte-cadeau.ts`
- Create: `site/src/pages/carte-cadeau.astro`, `site/src/pages/en/gift-card.astro`

**Interfaces :**
- Consumes : `validerMontant`, `MONTANTS_PROPOSES` (Task 2) ; `formaterPrix` (Task 2) ; `lienWhatsApp`, `messageCarteCadeau` (Task 4) ; `<CarteCadeauVisuel>` (Task 8) ; collection `rituels`.
- Produces :
  - la page `/carte-cadeau/` ;
  - le contrat JSON `#donnees-cadeau` : `{ lang, whatsapp, rituels: { id, libelle }[], textes: { vide: string, erreurs: { vide, invalide, 'trop-bas', 'trop-haut', de, pour } } }`.

- [ ] **Step 1 : La page**

<!-- fichier: site/src/components/pages/CarteCadeau.astro -->
```astro
---
import { getCollection } from 'astro:content';
import type { Lang } from '../../lib/i18n';
import { MONTANTS_PROPOSES } from '../../lib/cadeau';
import { formaterPrix } from '../../lib/prix';
import { chemin } from '../../lib/routes';
import { site } from '../../lib/site';
import { t } from '../../i18n/ui';
import Base from '../../layouts/Base.astro';
import CarteCadeauVisuel from '../CarteCadeauVisuel.astro';
import FilAriane from '../FilAriane.astro';
import Titre from '../Titre.astro';

interface Props { lang: Lang }
const { lang } = Astro.props;
const _ = t(lang);
const rituels = (await getCollection('rituels')).sort((a, b) => a.data.ordre - b.data.ordre);
const libelleRituel = (r: (typeof rituels)[number]) => `${r.data.nom[lang]} · ${r.data.duree}`;
const donnees = {
  lang,
  whatsapp: site.whatsapp,
  rituels: rituels.map((r) => ({ id: r.id, libelle: libelleRituel(r) })),
  textes: {
    vide: '—',
    erreurs: {
      vide: _('cadeau.erreur.vide'),
      invalide: _('cadeau.erreur.invalide'),
      'trop-bas': _('cadeau.erreur.trop-bas'),
      'trop-haut': _('cadeau.erreur.trop-haut'),
      de: _('cadeau.erreur.de'),
      pour: _('cadeau.erreur.pour'),
    },
  },
};
const etapes = [
  { nom: _('fil.accueil'), href: chemin('accueil', lang) },
  { nom: _('cadeau.surtitre'), href: chemin('carte-cadeau', lang) },
];
const champ = 'mt-3 w-full border border-encre/25 bg-white/70 px-4 py-3.5 text-lg outline-none transition-colors focus:border-encre';
const etiquette = 'surtitre block text-brun';
const defaut = formaterPrix(MONTANTS_PROPOSES[1], lang);
---
<Base lang={lang} page="carte-cadeau" titre={_('meta.cadeau.titre')} description={_('meta.cadeau.description')}>
  <section class="mx-auto max-w-7xl px-5 pb-24 pt-8 md:px-8 md:pt-12">
    <FilAriane lang={lang} etapes={etapes} />
    <Titre niveau="h1" class="mt-8" surtitre={_('cadeau.surtitre')} titre={_('cadeau.titre')} intro={_('cadeau.intro')} />

    <div class="mt-14 grid gap-14 lg:grid-cols-12">
      <form id="form-cadeau" novalidate class="space-y-10 lg:col-span-6">
        <fieldset>
          <legend class="font-serif text-2xl md:text-3xl">{_('cadeau.choix')}</legend>
          <div class="mt-6 grid grid-cols-2 gap-2">
            <label class="pastille"><input type="radio" name="type" value="montant" class="sr-only" checked />{_('cadeau.montant')}</label>
            <label class="pastille"><input type="radio" name="type" value="rituel" class="sr-only" />{_('cadeau.rituel')}</label>
          </div>
          <div data-groupe="montant" class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MONTANTS_PROPOSES.map((m, i) => <label class="pastille"><input type="radio" name="montant" value={String(m)} class="sr-only" checked={i === 1} />{formaterPrix(m, lang)}</label>)}
            <label class="pastille"><input type="radio" name="montant" value="libre" class="sr-only" />{_('cadeau.libre')}</label>
          </div>
          <div data-groupe="libre" hidden class="mt-4">
            <label for="montant-libre" class="sr-only">{_('cadeau.libre')}</label>
            <input id="montant-libre" inputmode="numeric" autocomplete="off" placeholder={_('cadeau.librePlaceholder')} class={champ} />
          </div>
          <div data-groupe="rituel" hidden class="mt-4 grid gap-2">
            {rituels.map((r, i) => <label class="pastille justify-start text-left"><input type="radio" name="rituel" value={r.id} class="sr-only" checked={i === 0} />{libelleRituel(r)}</label>)}
          </div>
        </fieldset>
        <div class="grid gap-6 sm:grid-cols-2">
          <div><label for="de" class={etiquette}>{_('cadeau.de')}</label><input id="de" maxlength="40" autocomplete="given-name" class={champ} /></div>
          <div><label for="pour" class={etiquette}>{_('cadeau.pour')}</label><input id="pour" maxlength="40" autocomplete="off" class={champ} /></div>
        </div>
        <div><label for="mot" class={etiquette}>{_('cadeau.mot')}</label><textarea id="mot" rows="3" maxlength="140" class={champ}></textarea></div>
        <p id="erreur-cadeau" role="alert" class="min-h-[1.5em] text-sm text-or-profond"></p>
        <button type="submit" class="w-full bg-encre py-4 text-[12px] uppercase tracking-[.2em] text-creme transition-colors hover:bg-or-profond">{_('cadeau.envoyer')} <span class="fleche" aria-hidden="true">→</span></button>
        <p class="text-sm text-brun">{_('cadeau.paiement')}</p>
      </form>

      <div class="lg:col-span-6">
        <div class="lg:sticky lg:top-24">
          <p class="surtitre mb-5 text-or-profond">{_('cadeau.apercu')}</p>
          <div id="apercu" aria-live="polite">
            <CarteCadeauVisuel lang={lang} offre={defaut} pour="—" de="—" />
          </div>
        </div>
      </div>
    </div>
  </section>
  <script id="donnees-cadeau" type="application/json" set:html={JSON.stringify(donnees)} />
</Base>

<script>
  import '../../scripts/carte-cadeau';
</script>
```

- [ ] **Step 2 : Le script**

<!-- fichier: site/src/scripts/carte-cadeau.ts -->
```ts
import { validerMontant } from '../lib/cadeau';
import type { Lang } from '../lib/i18n';
import { formaterPrix } from '../lib/prix';
import { lienWhatsApp, messageCarteCadeau } from '../lib/whatsapp';

type Erreur = 'vide' | 'invalide' | 'trop-bas' | 'trop-haut' | 'de' | 'pour';
type Donnees = { lang: Lang; whatsapp: string; rituels: { id: string; libelle: string }[]; textes: { vide: string; erreurs: Record<Erreur, string> } };

const form = document.querySelector<HTMLFormElement>('#form-cadeau');
const brut = document.querySelector('#donnees-cadeau')?.textContent;
if (form && brut) initialiser(form, JSON.parse(brut) as Donnees);

function initialiser(form: HTMLFormElement, d: Donnees) {
  const apercu = document.querySelector<HTMLElement>('#apercu')!;
  const erreur = form.querySelector<HTMLElement>('#erreur-cadeau')!;
  const champ = (id: string) => form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
  const coche = (nom: string) => form.querySelector<HTMLInputElement>(`input[name="${nom}"]:checked`)?.value ?? '';
  const groupe = (nom: string) => form.querySelector<HTMLElement>(`[data-groupe="${nom}"]`)!;
  const ecrire = (nom: string, texte: string) => {
    const el = apercu.querySelector<HTMLElement>(`[data-champ="${nom}"]`);
    if (el) el.textContent = texte;
  };

  /** Ce qu'on offre, prêt à afficher ; `erreur` si le montant libre est invalide. */
  function offre(): { texte: string } | { erreur: Erreur } {
    if (coche('type') === 'rituel') return { texte: d.rituels.find((r) => r.id === coche('rituel'))?.libelle ?? d.textes.vide };
    if (coche('montant') !== 'libre') return { texte: formaterPrix(Number(coche('montant')), d.lang) };
    const r = validerMontant(champ('montant-libre').value);
    return r.ok ? { texte: formaterPrix(r.montant, d.lang) } : { erreur: r.erreur };
  }

  function maj() {
    const estRituel = coche('type') === 'rituel';
    groupe('montant').hidden = estRituel;
    groupe('rituel').hidden = !estRituel;
    groupe('libre').hidden = estRituel || coche('montant') !== 'libre';
    const o = offre();
    ecrire('offre', 'texte' in o ? o.texte : d.textes.vide);
    ecrire('pour', champ('pour').value.trim() || d.textes.vide);
    ecrire('de', champ('de').value.trim() || d.textes.vide);
    ecrire('mot', champ('mot').value.trim());
  }

  form.addEventListener('input', () => {
    erreur.textContent = '';
    maj();
  });
  form.addEventListener('change', maj);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const o = offre();
    const de = champ('de').value.trim();
    const pour = champ('pour').value.trim();
    const probleme: Erreur | null = 'erreur' in o ? o.erreur : !de ? 'de' : !pour ? 'pour' : null;
    if (probleme) {
      erreur.textContent = d.textes.erreurs[probleme];
      const cible = probleme === 'de' || probleme === 'pour' ? champ(probleme) : champ('montant-libre');
      cible.focus();
      return;
    }
    const message = messageCarteCadeau({ offre: (o as { texte: string }).texte, de, pour, mot: champ('mot').value }, d.lang);
    const lien = lienWhatsApp(d.whatsapp, message);
    const fenetre = window.open(lien, '_blank');
    if (fenetre) fenetre.opener = null;
    else location.href = lien;
  });

  maj();
}
```

<!-- fichier: site/src/pages/carte-cadeau.astro -->
```astro
---
import CarteCadeau from '../components/pages/CarteCadeau.astro';
---
<CarteCadeau lang="fr" />
```

<!-- fichier: site/src/pages/en/gift-card.astro -->
```astro
---
import CarteCadeau from '../../components/pages/CarteCadeau.astro';
---
<CarteCadeau lang="en" />
```

- [ ] **Step 3 : Build**

Run: `npm run build && npm test` → Expected : « Complete! », tests PASS.

- [ ] **Step 4 : Test du parcours (Playwright)**

1. Sur `/carte-cadeau/`, l'aperçu affiche « 50 000 FCFA ».
2. Choisir « Autre montant » et saisir « 5000 ». Saisir « Awa » dans « De la part de » et « Maman » dans « Pour », puis envoyer. Attendu : « Minimum 10 000 FCFA. » et le focus sur le champ montant.
3. Remplacer par « 30 000 ». L'aperçu doit afficher « 30 000 FCFA ».
4. Saisir le mot « Joyeux anniversaire ! 🎉 ». Il apparaît sur la carte.
5. Envoyer avec `window.open` intercepté (même méthode que la Task 10). Le `text` décodé doit contenir :
   - `carte cadeau : 30 000 FCFA` ;
   - `Pour : Maman` ;
   - `Message : « Joyeux anniversaire ! 🎉 »`.
6. Passer sur « Un rituel » : l'aperçu affiche « Escale Saly · 60 min ».
7. Faire de même sur `/en/gift-card/` : message en anglais.
8. Captures en 390 et 1440 px.

- [ ] **Step 5 : Commit**

```bash
git add -A && git commit -m "Carte cadeau : montant ou rituel, aperçu en direct, commande WhatsApp, paiement Wave/Orange Money"
```

---

### Task 12 : 404, en-têtes d'hébergement et contrôle automatique de `dist/`

**Files :**
- Create: `site/src/pages/404.astro`
- Create: `site/public/_headers`
- Create: `site/scripts/verifier-dist.mjs`

**Interfaces :**
- Consumes : `Base` avec `page="404"` (Task 7).
- Produces : `npm run verifier`, qui échoue (exit 1) avec la liste des problèmes.

- [ ] **Step 1 : Page 404**

<!-- fichier: site/src/pages/404.astro -->
```astro
---
import Base from '../layouts/Base.astro';
import { ui } from '../i18n/ui';
import { chemin } from '../lib/routes';
---
<Base lang="fr" page="404" titre="Page introuvable — MEDI-SPA Saly" description="Cette page n'existe pas ou plus. Retrouvez nos massages, hammam, balnéo et soins à Saly Portudal.">
  <section class="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-5 py-24 text-center">
    <div class="arche h-40 w-28 border border-or-vif" aria-hidden="true"></div>
    <h1 class="mt-10 text-5xl md:text-6xl">{ui.fr['e404.titre']}</h1>
    <p class="mt-5 text-lg text-brun">{ui.fr['e404.texte']}</p>
    <p class="mt-2 text-brun" lang="en">{ui.en['e404.titre']} {ui.en['e404.texte']}</p>
    <div class="mt-10 flex flex-wrap justify-center gap-3">
      <a href={chemin('accueil', 'fr')} class="bg-encre px-8 py-4 text-[12px] uppercase tracking-[.2em] text-creme">{ui.fr['e404.cta']}</a>
      <a href={chemin('accueil', 'en')} lang="en" class="border border-encre/25 px-8 py-4 text-[12px] uppercase tracking-[.2em]">{ui.en['e404.cta']}</a>
    </div>
  </section>
</Base>
```

- [ ] **Step 2 : En-têtes Cloudflare Pages / Netlify**

<!-- fichier: site/public/_headers -->
```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

- [ ] **Step 3 : Script de contrôle**

<!-- fichier: site/scripts/verifier-dist.mjs -->
```js
// Contrôle le site construit (dist/) : langue, h1, SEO, liens internes, WhatsApp, mode démo.
// Usage : npm run build && npm run verifier
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const site = JSON.parse(await readFile(new URL('../src/data/site.json', import.meta.url), 'utf8'));
const MOTS_FR = ['Réserver', 'Soins visage', 'Épilation', 'Kinésithérapie', 'Carte cadeau', 'Nous trouver', 'à partir de', 'Sur devis', 'Découvrir', 'Prénom'];
const erreurs = [];
const existe = (p) => stat(p).then(() => true, () => false);

async function* pagesHtml(dossier) {
  for (const e of await readdir(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, e.name);
    if (e.isDirectory()) yield* pagesHtml(chemin);
    else if (e.name.endsWith('.html')) yield chemin;
  }
}

let nb = 0;
for await (const fichier of pagesHtml(DIST)) {
  nb++;
  const html = await readFile(fichier, 'utf8');
  const route = '/' + relative(DIST, fichier).replace(/index\.html$/, '');
  const est404 = route === '/404.html';
  const langAttendue = route.startsWith('/en/') ? 'en' : 'fr';
  const err = (m) => erreurs.push(`${route} : ${m}`);

  const lang = html.match(/<html lang="([a-z]+)"/)?.[1];
  if (lang !== langAttendue) err(`lang="${lang}" au lieu de "${langAttendue}"`);
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) err('il faut exactement un <h1>');
  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) err('meta description absente ou trop courte');
  if (!est404) for (const h of ['fr', 'en', 'x-default']) if (!html.includes(`hreflang="${h}"`)) err(`hreflang ${h} manquant`);
  const noindex = html.includes('name="robots" content="noindex');
  if (site.demo !== noindex) err(`noindex=${noindex} alors que demo=${site.demo}`);

  for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const cible = href.endsWith('/') ? join(DIST, href, 'index.html') : join(DIST, href);
    if (!(await existe(cible))) err(`lien interne cassé ${href}`);
  }
  for (const [, url] of html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)) {
    const u = new URL(url.replaceAll('&amp;', '&'));
    if (u.pathname !== `/${site.whatsapp}`) err(`numéro WhatsApp inattendu ${u.pathname}`);
    if (!u.searchParams.get('text')) err('lien WhatsApp sans message');
  }
  if (langAttendue === 'en') {
    const texte = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<blockquote[^>]*lang="fr"[\s\S]*?<\/blockquote>/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    for (const mot of MOTS_FR) if (texte.includes(mot)) err(`texte français « ${mot} » sur une page EN`);
  }
}

if (nb === 0) erreurs.push('dist/ est vide : lancer npm run build');
if (erreurs.length) {
  console.error(`✗ ${erreurs.length} problème(s) sur ${nb} pages :\n- ${erreurs.join('\n- ')}`);
  process.exit(1);
}
console.log(`✓ ${nb} pages vérifiées, aucun problème.`);
```

- [ ] **Step 4 : Vérifier que le contrôle détecte vraiment une erreur**

Dans `src/i18n/ui.ts`, remplacer temporairement `'nav.soins': 'Treatments'` par `'nav.soins': 'Soins visage'`, puis lancer :

Run: `npm run build && npm run verifier`
Expected : FAIL avec « texte français « Soins visage » sur une page EN ». Annuler ensuite la modification (`git checkout src/i18n/ui.ts`).

- [ ] **Step 5 : Contrôle complet**

Run: `npm run build && npm run verifier && npm test`
Expected : `✓ 23 pages vérifiées, aucun problème.` Soit 2 accueils, 2 listes, 14 fiches, 2 réservations, 2 cartes cadeaux et la 404. Tests PASS. Corriger toute erreur remontée.

- [ ] **Step 6 : Commit**

```bash
git add -A && git commit -m "404 bilingue, en-têtes d'hébergement, contrôle automatique de dist (langue, SEO, liens, WhatsApp, démo)"
```

---

### Task 13 : Vérification visuelle complète, accessibilité et performance

**Files :**
- Modify : tout composant à corriger selon les constats.

- [ ] **Step 1 : Captures systématiques**

Lancer `npm run build && npm run preview` en arrière-plan. Pour chaque page, forcer `.reveal` visibles et faire défiler en bas pour charger les images, puis prendre des captures pleine page :

| Page | 390 px | 820 px | 1440 px |
|---|---|---|---|
| `/` | ✓ | ✓ | ✓ |
| `/en/` | ✓ | | ✓ |
| `/soins/` | ✓ | | ✓ |
| `/soins/massage-saly/` | ✓ | ✓ | ✓ |
| `/en/treatments/kinesitherapie-saly/` | ✓ | | |
| `/reserver/` | ✓ | ✓ | ✓ |
| `/carte-cadeau/` | ✓ | ✓ | ✓ |
| `/404.html` | ✓ | | |

Relire chaque capture avec Read. Critères :
- aucun débordement horizontal (`document.documentElement.scrollWidth <= innerWidth` à vérifier par `browser_evaluate` à 390 px) ;
- hiérarchie claire ;
- aucune photo déformée ou hors sujet ;
- boutons d'au moins 44 px de haut au doigt ;
- or et brun lisibles ;
- aucun texte français sur les pages EN.

- [ ] **Step 2 : Lighthouse mobile**

Avec `mcp__plugin_chrome-devtools-mcp_chrome-devtools__lighthouse_audit` (ou `npx lighthouse <url> --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --quiet --chrome-flags="--headless"`), auditer `http://localhost:4321/` et `http://localhost:4321/soins/massage-saly/`.

**Cible** : ≥ 95 dans les 4 catégories.

**Exception** : SEO est plafonné par le `noindex` volontaire de la démo. Relancer l'audit SEO une fois avec `demo: false` le temps de la mesure, puis remettre `demo: true`.

Corriger toute alerte, notamment les contrastes, les `alt`, la taille des cibles tactiles et le LCP.

- [ ] **Step 3 : Navigation clavier**

Au clavier seul sur `/reserver/` (Tab, flèches dans les groupes radio, Entrée), vérifier :
- le lien d'évitement apparaît au premier Tab ;
- le focus est toujours visible ;
- on peut compléter et envoyer la réservation ;
- `Échap` ferme le menu mobile.

- [ ] **Step 4 : Commit**

```bash
git add -A && git commit -m "Finitions après revue visuelle, Lighthouse et navigation clavier"
```

---

### Task 14 : Documentation et supports de prospection

**Files :**
- Rewrite: `site/README.md`, `site/STACK.md`, `site/GUIDE-GESTION.md`
- Modify: `dossier-prospection.md`, `message-approche.txt`

- [ ] **Step 1 : `site/README.md`**

À réécrire entièrement avec quatre sections.

1. **Lancer** : `npm install`, `npm run dev`, `npm test`, `npm run build`, `npm run verifier`.
2. **Où modifier quoi** (tableau) :

| Besoin | Fichier |
|---|---|
| Prix, textes ou photo d'un soin | `src/content/soins/<slug>.json` |
| Rituels | `src/content/rituels/` |
| Horaires, téléphone, nocturnes, mode démo | `src/data/site.json` |
| Boutons et libellés FR/EN | `src/i18n/ui.ts` |
| Avis (copie exacte Google uniquement) | `src/content/avis.json` |
| Photos | `photos-sources/`, puis `python3 scripts/photos.py` |

3. **Architecture** : 5 lignes reprenant l'en-tête du plan.
4. **Passage démo → production** (checklist) :
   - `demo: false` ;
   - vrais tarifs ;
   - horaires confirmés ;
   - `nocturnes` à jour ;
   - logo officiel à la place de `Logo.astro` et `favicon.svg` ;
   - droits photos signés (`SOURCES-PHOTOS.md`) ;
   - `ficheGoogle` et `lienAvisGoogle` exacts ;
   - domaine dans `astro.config.mjs` ;
   - `npm run build && npm run verifier`.

- [ ] **Step 2 : `site/STACK.md`**

À réécrire.
- Garder le tableau des choix, mais retirer Decap. La ligne « Admin cliente » devient « Mises à jour : par le prestataire, sur demande WhatsApp (forfait maintenance) ».
- Ajouter les lignes : Tailwind 4, `astro:assets` (AVIF/WebP), Vitest, `verifier-dist`.
- Section « Pourquoi pas WordPress » : la garder.
- Section « Limites assumées » : paiement en ligne et calendrier temps réel en phase 2, pas d'admin cliente (choix commercial).

- [ ] **Step 3 : `site/GUIDE-GESTION.md`**

À réécrire pour la gérante, en français simple. Quatre sections.
1. **« Pour changer quelque chose sur le site »** : envoyez un WhatsApp au prestataire (prix, horaires, nouvelle photo, nouvelle nocturne avec dates). Mise en ligne dans la journée.
2. **« Comment arrivent les réservations »** : un message WhatsApp complet (soin, formule, prix, jour, moment, prénom). Répondre pour confirmer l'heure exacte.
3. **« Les cartes cadeaux »** : le message indique le montant ou le rituel, qui offre et pour qui. Envoyer le lien Wave ou Orange Money, puis la carte (le visuel de la carte peut être fourni en PDF en phase 2).
4. **« Les nocturnes »** : envoyer les dates au prestataire. Elles s'affichent en haut du site et disparaissent seules une fois passées.

- [ ] **Step 4 : `dossier-prospection.md`**

- Corriger « voir maquette `index.html` » en « voir le site de démo (`site/`) ».
- Dans « Offre », retirer toute mention d'admin et préciser « mises à jour incluses dans la maintenance ».
- Ajouter une section **« 7. Questions à poser en visite »** :
  1. Horaires exacts, dimanche compris ?
  2. Les nocturnes sont-elles toujours d'actualité ? Prochaines dates ?
  3. Vrais tarifs de chaque soin et des rituels (les noms des rituels vous conviennent-ils ?).
  4. Les descriptions de soins correspondent-elles à vos protocoles (hammam, kiné, amincissement) ?
  5. Pouvez-vous m'envoyer le logo en fichier (PDF, SVG ou PNG haute définition) ?
  6. Accord écrit pour utiliser vos photos (façade, cabines, Facebook) ?
  7. 15 à 20 photos réelles : cabines, hammam, balnéo, équipe, produits.
  8. Accord pour citer des avis Google sur le site ?
  9. Numéro Wave / Orange Money pour les cartes cadeaux ?
  10. Nom de domaine souhaité (medi-spa-saly.sn ?).

- [ ] **Step 5 : `message-approche.txt`**

- Dans le message 1, remplacer la parenthèse des fonctionnalités par « (réservation guidée sur WhatsApp, carte cadeau, vos soins en français et en anglais) ».
- Dans le message 2, ajouter : « Vous m'envoyez vos changements sur WhatsApp, c'est en ligne dans la journée. »

- [ ] **Step 6 : Commit**

```bash
git add -A && git commit -m "Docs : README, stack, guide gérante, questions de visite, messages d'approche à jour"
```

---

## Fin du plan

Une fois la Task 14 terminée : `npm test && npm run build && npm run verifier` au vert, puis une revue complète de la branche avant de présenter le résultat.
