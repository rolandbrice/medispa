import { describe, expect, it } from 'vitest';
import brut from '../data/site.json';
import { schemaSite, telHref } from './site';

describe('site.json', () => {
  it('respecte le schéma', () => {
    expect(() => schemaSite.parse(brut)).not.toThrow();
  });
  it('refuse un numéro WhatsApp avec + ou espaces', () => {
    expect(() => schemaSite.parse({ ...brut, whatsapp: '+221 78 595 15 15' })).toThrow();
  });
  it('refuse une plage horaire mal écrite', () => {
    expect(() => schemaSite.parse({ ...brut, horaires: { ...brut.horaires, lun: ['9h', '20h'] } })).toThrow();
  });
  it('accepte une nocturne bien formée', () => {
    const nocturne = { debut: '2026-12-19', fin: '2026-12-20', heures: ['18:00', '21:00'], quand: { fr: 'x', en: 'x' } };
    expect(() => schemaSite.parse({ ...brut, nocturnes: [nocturne] })).not.toThrow();
  });
  it('refuse une nocturne dont la fin précède le début', () => {
    const nocturne = { debut: '2026-12-20', fin: '2026-12-19', heures: ['18:00', '21:00'], quand: { fr: 'x', en: 'x' } };
    expect(() => schemaSite.parse({ ...brut, nocturnes: [nocturne] })).toThrow();
  });
  it('refuse des heures de nocturne en texte libre (elles doivent pouvoir se traduire)', () => {
    const nocturne = { debut: '2026-12-19', fin: '2026-12-20', heures: '18h–21h', quand: { fr: 'x', en: 'x' } };
    expect(() => schemaSite.parse({ ...brut, nocturnes: [nocturne] })).toThrow();
  });
  it('fabrique un lien tel: sans espaces', () => {
    expect(telHref()).toBe('tel:+221785951515');
  });
});
