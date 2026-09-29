import { describe, expect, it } from 'vitest';
import { estPassee, nocturnesAVenir, texteBanniere, type Nocturne } from './nocturnes';

const t = { fr: 'x', en: 'x' };
const n = (debut: string, fin: string): Nocturne => ({ debut, fin, heures: ['18:00', '21:00'], quand: t });
const midi = (jour: string) => new Date(jour + 'T12:00:00Z');

describe('texteBanniere', () => {
  const nocturne: Nocturne = {
    debut: '2026-10-09',
    fin: '2026-10-10',
    heures: ['18:00', '21:00'],
    quand: { fr: 'vendredi 9 et samedi 10 octobre', en: 'Friday 9 and Saturday 10 October' },
  };
  it('rédige la bannière en français, heures à la française', () => {
    expect(texteBanniere(nocturne, 'fr')).toBe('Nocturne : vendredi 9 et samedi 10 octobre, 18 h – 21 h.');
  });
  it('rédige la bannière en anglais, sans typographie ni heures françaises', () => {
    expect(texteBanniere(nocturne, 'en')).toBe('Late night: Friday 9 and Saturday 10 October, 6 pm – 9 pm.');
  });
});

describe('estPassee', () => {
  it('le dernier jour de l’événement n’est pas encore passé', () => {
    expect(estPassee('2026-12-20', midi('2026-12-20'))).toBe(false);
  });
  it('le lendemain, il est passé', () => {
    expect(estPassee('2026-12-20', midi('2026-12-21'))).toBe(true);
  });
});

describe('nocturnesAVenir', () => {
  it('écarte les passées et trie par date de début', () => {
    const liste = [n('2026-12-26', '2026-12-27'), n('2025-12-19', '2025-12-20'), n('2026-12-19', '2026-12-20')];
    expect(nocturnesAVenir(liste, midi('2026-09-28')).map((x) => x.debut)).toEqual(['2026-12-19', '2026-12-26']);
  });
  it('renvoie une liste vide si tout est passé', () => {
    expect(nocturnesAVenir([n('2025-12-19', '2025-12-20')], midi('2026-09-28'))).toEqual([]);
  });
});
