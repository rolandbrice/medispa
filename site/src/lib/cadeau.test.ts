import { describe, expect, it } from 'vitest';
import { validerMontant } from './cadeau';

describe('validerMontant', () => {
  it.each(['50000', '50 000', '50 000', '50.000', '50,000', '50 000 FCFA', '50000F', ' 50 000 cfa '])(
    'accepte « %s »',
    (saisie) => {
      expect(validerMontant(saisie)).toEqual({ ok: true, montant: 50000 });
    },
  );
  it('refuse le vide', () => {
    expect(validerMontant('')).toEqual({ ok: false, erreur: 'vide' });
    expect(validerMontant('   ')).toEqual({ ok: false, erreur: 'vide' });
  });
  it('refuse ce qui n’est pas un nombre entier positif', () => {
    expect(validerMontant('abc')).toEqual({ ok: false, erreur: 'invalide' });
    expect(validerMontant('-5000')).toEqual({ ok: false, erreur: 'invalide' });
    expect(validerMontant('25k')).toEqual({ ok: false, erreur: 'invalide' });
  });
  it('borne entre 10 000 et 500 000', () => {
    expect(validerMontant('5000')).toEqual({ ok: false, erreur: 'trop-bas' });
    expect(validerMontant('1 000 000')).toEqual({ ok: false, erreur: 'trop-haut' });
    expect(validerMontant('10000')).toEqual({ ok: true, montant: 10000 });
    expect(validerMontant('500000')).toEqual({ ok: true, montant: 500000 });
  });
});
