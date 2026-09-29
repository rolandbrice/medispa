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
