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
