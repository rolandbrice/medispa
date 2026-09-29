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

/** « Relaxant (60 min) » ; la durée est insécable pour ne jamais se couper en fin de ligne. */
export function nomTarif(t: Tarif, lang: Lang): string {
  const duree = t.duree?.replace(/ /g, '\u00a0');
  if (t.libelle && duree) return `${t.libelle[lang]} (${duree})`;
  return t.libelle?.[lang] ?? duree ?? '';
}

/** « Dès 12 000 FCFA » pour les listes ; « Sur devis » si aucun prix payant. */
export function aPartirDe(tarifs: Tarif[], lang: Lang): string {
  const min = prixMin(tarifs);
  if (min === null) return formaterPrix(null, lang);
  return `${lang === 'fr' ? 'Dès' : 'From'} ${formaterPrix(min, lang)}`;
}
