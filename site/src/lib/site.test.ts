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
  it('refuse une nocturne dont la fin précède le début', () => {
    const t = { fr: 'x', en: 'x' };
    const nocturne = { debut: '2026-12-20', fin: '2026-12-19', heures: '18h–21h', quand: t, titre: t, texte: t };
    expect(() => schemaSite.parse({ ...brut, nocturnes: [nocturne] })).toThrow();
  });
  it('fabrique un lien tel: sans espaces', () => {
    expect(telHref()).toBe('tel:+221785951515');
  });
});
