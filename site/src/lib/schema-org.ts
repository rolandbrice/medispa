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
