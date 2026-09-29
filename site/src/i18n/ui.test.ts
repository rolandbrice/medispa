import { describe, expect, it } from 'vitest';
import { remplir, ui } from './ui';

describe('textes d’interface', () => {
  it('ont exactement les mêmes clés en FR et en EN', () => {
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.fr).sort());
  });
  it('n’ont aucune valeur vide', () => {
    for (const lang of ['fr', 'en'] as const) {
      for (const [cle, valeur] of Object.entries(ui[lang])) expect(valeur.trim(), `${lang}.${cle}`).not.toBe('');
    }
  });
  it('n’oublient pas de traduire (aucune valeur EN identique au FR, sauf mots communs aux deux langues)', () => {
    const identiques = Object.keys(ui.fr).filter((c) => ui.fr[c as keyof typeof ui.fr] === ui.en[c as keyof typeof ui.en]);
    expect(identiques.sort()).toEqual(['contact.titre', 'cta.whatsapp', 'nav.contact', 'nav.menu'].sort());
  });
  it('respectent les règles de texte : ni point médian, ni flèche', () => {
    for (const lang of ['fr', 'en'] as const) {
      for (const [cle, valeur] of Object.entries(ui[lang])) {
        expect(valeur, `${lang}.${cle}`).not.toMatch(/ · |→/);
      }
    }
  });
});

describe('remplir', () => {
  it('remplace les variables entre accolades', () => {
    expect(remplir('Noté {note} sur 5 ({n} avis).', { note: '4,8', n: 71 })).toBe('Noté 4,8 sur 5 (71 avis).');
  });
  it('laisse intactes les variables absentes', () => {
    expect(remplir('{a} et {b}', { a: 1 })).toBe('1 et {b}');
  });
});
