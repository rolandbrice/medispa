import { describe, expect, it } from 'vitest';
import { creneauxDisponibles, formaterJour, formaterJourCourt, formaterMois, formaterPlage, prochainsJours, resumerHoraires, type Horaires } from './horaires';

const H: Horaires = {
  lun: ['09:00', '20:00'], mar: ['09:00', '20:00'], mer: ['09:00', '20:00'],
  jeu: ['09:00', '20:00'], ven: ['09:00', '20:00'], sam: ['09:00', '20:00'], dim: null,
};
const utc = (iso: string) => new Date(iso + 'Z');

describe('creneauxDisponibles', () => {
  it('propose les trois créneaux un jour ouvert à venir', () => {
    expect(creneauxDisponibles(utc('2026-10-03T00:00:00'), H, utc('2026-09-28T10:00:00'))).toEqual(['matin', 'apres-midi', 'soir']);
  });
  it('ne propose rien le dimanche fermé', () => {
    expect(creneauxDisponibles(utc('2026-10-04T00:00:00'), H, utc('2026-09-28T10:00:00'))).toEqual([]);
  });
  it('ne propose rien pour un jour passé', () => {
    expect(creneauxDisponibles(utc('2026-09-27T00:00:00'), H, utc('2026-09-28T10:00:00'))).toEqual([]);
  });
  it('le jour même à 10 h, garde matin (90 min restantes) et la suite', () => {
    expect(creneauxDisponibles(utc('2026-10-03T00:00:00'), H, utc('2026-10-03T10:00:00'))).toEqual(['matin', 'apres-midi', 'soir']);
  });
  it('le jour même à 11 h, retire le matin (moins de 60 min après préavis)', () => {
    expect(creneauxDisponibles(utc('2026-10-03T00:00:00'), H, utc('2026-10-03T11:00:00'))).toEqual(['apres-midi', 'soir']);
  });
  it('le samedi à 18 h 30, il reste la soirée (19 h – 20 h)', () => {
    expect(creneauxDisponibles(utc('2026-10-03T00:00:00'), H, utc('2026-10-03T18:30:00'))).toEqual(['soir']);
  });
  it('le samedi à 18 h 45, plus rien : le jour doit être grisé', () => {
    expect(creneauxDisponibles(utc('2026-10-03T00:00:00'), H, utc('2026-10-03T18:45:00'))).toEqual([]);
  });
  it('ignore l’heure de la date demandée (seul le jour compte)', () => {
    expect(creneauxDisponibles(utc('2026-10-03T23:59:00'), H, utc('2026-09-28T10:00:00'))).toEqual(['matin', 'apres-midi', 'soir']);
  });
});

describe('prochainsJours', () => {
  it('renvoie 14 jours à partir d’aujourd’hui, dimanche sans créneau', () => {
    const jours = prochainsJours(utc('2026-09-28T10:00:00'), H);
    expect(jours).toHaveLength(14);
    expect(jours[0].iso).toBe('2026-09-28');
    expect(jours[6].iso).toBe('2026-10-04');
    expect(jours[6].creneaux).toEqual([]);
    expect(jours[13].iso).toBe('2026-10-11');
  });
});

describe('formaterPlage', () => {
  it('écrit les heures à la française', () => {
    expect(formaterPlage(['09:00', '20:00'], 'fr')).toBe('9 h – 20 h');
    expect(formaterPlage(['09:30', '12:00'], 'fr')).toBe('9 h 30 – 12 h');
  });
  it('écrit les heures à l’anglaise', () => {
    expect(formaterPlage(['09:00', '20:00'], 'en')).toBe('9 am – 8 pm');
    expect(formaterPlage(['09:30', '12:00'], 'en')).toBe('9:30 am – 12 pm');
  });
});

describe('formaterMois', () => {
  it('date un avis au mois près', () => {
    expect(formaterMois('2026-08', 'fr')).toBe('août 2026');
    expect(formaterMois('2026-08', 'en')).toBe('August 2026');
  });
});

describe('formaterJour', () => {
  it('écrit le jour en toutes lettres, heure de Saly', () => {
    expect(formaterJour(utc('2026-10-03T00:00:00'), 'fr')).toBe('samedi 3 octobre');
    expect(formaterJour(utc('2026-10-03T00:00:00'), 'en')).toBe('Saturday 3 October');
  });
  it('fournit une forme courte pour les pastilles du calendrier', () => {
    expect(formaterJourCourt(utc('2026-10-03T00:00:00'), 'fr')).toEqual({ jour: 'sam.', num: '3', mois: 'oct.' });
    expect(formaterJourCourt(utc('2026-10-03T00:00:00'), 'en')).toEqual({ jour: 'Sat', num: '3', mois: 'Oct' });
  });
});

describe('resumerHoraires', () => {
  it('regroupe les jours consécutifs aux mêmes horaires en une phrase', () => {
    expect(resumerHoraires(H, 'fr')).toBe('Du lundi au samedi, de 9 h à 20 h.');
    expect(resumerHoraires(H, 'en')).toBe('Monday to Saturday, 9 am to 8 pm.');
  });
  it('sépare les groupes aux horaires différents', () => {
    const h: Horaires = { ...H, sam: ['10:00', '18:00'] };
    expect(resumerHoraires(h, 'fr')).toBe('Du lundi au vendredi, de 9 h à 20 h. Le samedi, de 10 h à 18 h.');
    expect(resumerHoraires(h, 'en')).toBe('Monday to Friday, 9 am to 8 pm. Saturday, 10 am to 6 pm.');
  });
});
