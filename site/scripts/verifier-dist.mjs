// Contrôle le site construit (dist/) : langue, h1, SEO, liens internes, WhatsApp, mode démo.
// Usage : npm run build && npm run verifier
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const site = JSON.parse(await readFile(new URL('../src/data/site.json', import.meta.url), 'utf8'));
const MOTS_FR = ['Réserver', 'Soins visage', 'Épilation', 'Kinésithérapie', 'Carte cadeau', 'Dès ', 'Sur devis', 'Prénom', 'Accueil', 'Tarifs'];
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
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');
  // Règles de texte (spec, révision 1) : ni point médian comme séparateur, ni flèche.
  if (/ · /.test(visible)) err('point médian « · » dans le texte');
  if (/[→➔➜]/.test(visible)) err('flèche dans le texte');
  if (langAttendue === 'en') {
    const texte = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      // Les avis sont cités mot pour mot, dans leur langue d'origine : on ne les contrôle pas.
      .replace(/<blockquote[\s\S]*?<\/blockquote>/g, ' ')
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
