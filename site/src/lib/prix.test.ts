import { describe, expect, it } from 'vitest';
import { aPartirDe, formaterPrix, nomTarif, prixMin } from './prix';

describe('formaterPrix', () => {
  it('formate en français avec espace fine et insécable', () => {
    expect(formaterPrix(25000, 'fr')).toBe('25 000 FCFA');
  });
  it('formate en anglais avec virgule', () => {
    expect(formaterPrix(25000, 'en')).toBe('25,000 FCFA');
  });
  it('affiche Offert / Free pour 0', () => {
    expect(formaterPrix(0, 'fr')).toBe('Offert');
    expect(formaterPrix(0, 'en')).toBe('Free');
  });
  it('affiche Sur devis / On request pour null', () => {
    expect(formaterPrix(null, 'fr')).toBe('Sur devis');
    expect(formaterPrix(null, 'en')).toBe('On request');
  });
});

describe('prixMin', () => {
  it('ignore les tarifs offerts et sur devis', () => {
    expect(prixMin([{ prix: 0 }, { prix: 20000 }, { prix: null }, { prix: 12000 }])).toBe(12000);
  });
  it('renvoie null sans tarif payant', () => {
    expect(prixMin([{ prix: null }])).toBeNull();
    expect(prixMin([{ prix: 0 }])).toBeNull();
    expect(prixMin([])).toBeNull();
  });
});

describe('aPartirDe', () => {
  it('annonce le plus petit prix payant', () => {
    expect(aPartirDe([{ prix: 0 }, { prix: 20000 }, { prix: 180000 }], 'fr')).toBe('à partir de 20\u202f000\u00a0FCFA');
    expect(aPartirDe([{ prix: 12000 }], 'en')).toBe('from 12,000\u00a0FCFA');
  });
  it('dit « Sur devis » quand aucun prix payant n’existe', () => {
    expect(aPartirDe([{ prix: null }], 'fr')).toBe('Sur devis');
    expect(aPartirDe([{ prix: null }], 'en')).toBe('On request');
  });
});

describe('nomTarif', () => {
  it('combine libellé traduit et durée', () => {
    expect(nomTarif({ prix: 1, duree: '60 min', libelle: { fr: 'Duo', en: 'Couple' } }, 'en')).toBe('Couple · 60 min');
  });
  it('se replie sur la durée seule, puis sur le libellé seul', () => {
    expect(nomTarif({ prix: 1, duree: '30 min' }, 'fr')).toBe('30 min');
    expect(nomTarif({ prix: 1, libelle: { fr: 'Sourcils', en: 'Brows' } }, 'fr')).toBe('Sourcils');
  });
});
