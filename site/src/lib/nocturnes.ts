import type { Texte } from './i18n';

export type Nocturne = { debut: string; fin: string; heures: string; quand: Texte; titre: Texte; texte: Texte };

/** Vrai quand la dernière soirée (« AAAA-MM-JJ ») est terminée, au jour près, heure de Saly (UTC). */
export function estPassee(fin: string, maintenant: Date): boolean {
  return fin < maintenant.toISOString().slice(0, 10);
}

export function nocturnesAVenir(liste: Nocturne[], maintenant: Date): Nocturne[] {
  return liste.filter((n) => !estPassee(n.fin, maintenant)).sort((a, b) => a.debut.localeCompare(b.debut));
}
