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
