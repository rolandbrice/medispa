import { remplir, ui } from '../i18n/ui';
import { formaterPlage } from './horaires';
import type { Lang, Texte } from './i18n';

/** Heures au format « hh:mm » : elles se traduisent (18 h – 21 h / 6 pm – 9 pm). */
export type Nocturne = { debut: string; fin: string; heures: [string, string]; quand: Texte };

/** Vrai quand la dernière soirée (« AAAA-MM-JJ ») est terminée, au jour près, heure de Saly (UTC). */
export function estPassee(fin: string, maintenant: Date): boolean {
  return fin < maintenant.toISOString().slice(0, 10);
}

export function nocturnesAVenir(liste: Nocturne[], maintenant: Date): Nocturne[] {
  return liste.filter((n) => !estPassee(n.fin, maintenant)).sort((a, b) => a.debut.localeCompare(b.debut));
}

/** « Nocturne : vendredi 9 et samedi 10 octobre, 18 h – 21 h. » dans la langue de la page. */
export function texteBanniere(n: Nocturne, lang: Lang): string {
  return remplir(ui[lang]['nocturnes.banniere'], { quand: n.quand[lang], heures: formaterPlage(n.heures, lang) });
}
