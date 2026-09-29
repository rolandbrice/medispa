// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { appliquerNocturnes } from './nocturnes-dom';

// Reproduit le balisage de BanniereNocturne.astro et de la section Nocturnes de l'accueil.
const FIXTURE = `
  <div data-banniere-nocturne data-fin="2026-10-10">A</div>
  <div data-banniere-nocturne data-fin="2026-10-17" hidden>B</div>
  <div data-nocturnes-liste><ul><li data-fin="2026-10-10">x</li><li data-fin="2026-10-17">y</li></ul></div>
  <a data-nocturnes-cta><span data-si="avenir">R</span><span data-si="aucune" hidden>D</span></a>`;
const midi = (jour: string) => new Date(`${jour}T12:00:00Z`);
const un = (s: string) => document.querySelector<HTMLElement>(s);
const bannieres = () => [...document.querySelectorAll<HTMLElement>('[data-banniere-nocturne]')].map((b) => [b.textContent, b.hidden]);

beforeEach(() => {
  document.body.innerHTML = FIXTURE;
});

describe('appliquerNocturnes', () => {
  it('avant toute date : ne retire rien, seule la première bannière est visible', () => {
    appliquerNocturnes(document, midi('2026-10-01'));
    expect(bannieres()).toEqual([['A', false], ['B', true]]);
    expect(document.querySelectorAll('li[data-fin]')).toHaveLength(2);
    expect(un('[data-si="avenir"]')!.hidden).toBe(false);
  });

  it('entre deux nocturnes : la bannière passée disparaît et la suivante s’affiche', () => {
    appliquerNocturnes(document, midi('2026-10-12'));
    expect(bannieres()).toEqual([['B', false]]);
    expect([...document.querySelectorAll('li')].map((l) => l.textContent)).toEqual(['y']);
    expect(un('[data-si="avenir"]')!.hidden).toBe(false);
    expect(un('[data-si="aucune"]')!.hidden).toBe(true);
  });

  it('après toutes les nocturnes : ni bannière ni liste, le bouton demande les prochaines dates', () => {
    appliquerNocturnes(document, midi('2026-10-20'));
    expect(bannieres()).toEqual([]);
    expect(un('[data-nocturnes-liste]')).toBeNull();
    expect(un('[data-si="avenir"]')!.hidden).toBe(true);
    expect(un('[data-si="aucune"]')!.hidden).toBe(false);
  });
});
