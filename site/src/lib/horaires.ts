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
