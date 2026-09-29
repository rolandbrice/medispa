import { describe, expect, it } from 'vitest';
import { autreLangue, chemin } from './routes';

describe('chemin', () => {
  it.each([
    ['accueil', 'fr', undefined, '/'],
    ['accueil', 'en', undefined, '/en/'],
    ['soins', 'fr', undefined, '/soins/'],
    ['soins', 'en', undefined, '/en/treatments/'],
    ['soin', 'fr', 'massage-saly', '/soins/massage-saly/'],
    ['soin', 'en', 'massage-saly', '/en/treatments/massage-saly/'],
    ['reserver', 'fr', undefined, '/reserver/'],
    ['reserver', 'en', undefined, '/en/book/'],
    ['carte-cadeau', 'fr', undefined, '/carte-cadeau/'],
    ['carte-cadeau', 'en', undefined, '/en/gift-card/'],
  ] as const)('%s en %s → %s', (page, lang, slug, attendu) => {
    expect(chemin(page, lang, slug)).toBe(attendu);
  });
  it('refuse une page soin sans slug', () => {
    expect(() => chemin('soin', 'fr')).toThrow();
  });
});

describe('autreLangue', () => {
  it('bascule fr ↔ en', () => {
    expect(autreLangue('fr')).toBe('en');
    expect(autreLangue('en')).toBe('fr');
  });
});
