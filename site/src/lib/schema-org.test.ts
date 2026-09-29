import { describe, expect, it } from 'vitest';
import { schemaEtablissement, schemaFAQ, schemaFilAriane, schemaService } from './schema-org';
import { site } from './site';

const BASE = 'https://medi-spa-saly.sn/';
const soin = {
  id: 'massage-saly',
  titre: { fr: 'Massages', en: 'Massages' },
  description: { fr: 'Desc', en: 'Desc' },
  tarifs: [{ prix: 20000, duree: '60 min' }, { prix: null, libelle: { fr: 'Sur mesure', en: 'Custom' } }, { prix: 0, libelle: { fr: 'Bilan', en: 'Assessment' } }],
};

describe('schemaEtablissement', () => {
  const s = schemaEtablissement({ ...site, facebook: undefined }, 'fr', BASE, 'https://x/img.jpg') as any;
  it('déclare un DaySpa avec un @id stable, sans double barre oblique', () => {
    expect(s['@type']).toBe('DaySpa');
    expect(s['@id']).toBe('https://medi-spa-saly.sn/#spa');
  });
  it('regroupe les jours aux mêmes horaires et ignore les jours fermés', () => {
    expect(s.openingHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '09:00', closes: '20:00' },
    ]);
  });
  it('n’inclut pas de réseau absent dans sameAs', () => {
    expect(s.sameAs).toEqual([site.instagram]);
  });
  it('déclare la note Google', () => {
    expect(s.aggregateRating).toMatchObject({ ratingValue: site.note, reviewCount: site.nbAvis, bestRating: 5 });
  });
});

describe('schemaService', () => {
  it('n’expose aucun prix en mode démo', () => {
    const s = schemaService(soin, { ...site, demo: true }, 'fr', BASE, 'https://x/img.jpg') as any;
    expect(s).not.toHaveProperty('offers');
    expect(s.provider).toEqual({ '@id': 'https://medi-spa-saly.sn/#spa' });
    expect(s.url).toBe('https://medi-spa-saly.sn/soins/massage-saly/');
  });
  it('expose les tarifs chiffrés en production, en XOF, sans les « sur devis »', () => {
    const s = schemaService(soin, { ...site, demo: false }, 'en', BASE, 'https://x/img.jpg') as any;
    expect(s.url).toBe('https://medi-spa-saly.sn/en/treatments/massage-saly/');
    expect(s.offers).toEqual([
      { '@type': 'Offer', name: '60 min', price: 20000, priceCurrency: 'XOF' },
      { '@type': 'Offer', name: 'Assessment', price: 0, priceCurrency: 'XOF' },
    ]);
  });
});

describe('schemaFAQ', () => {
  it('renvoie null sans question', () => {
    expect(schemaFAQ([], 'fr')).toBeNull();
  });
  it('construit une FAQPage dans la langue demandée', () => {
    const s = schemaFAQ([{ q: { fr: 'Q ?', en: 'Q?' }, r: { fr: 'R.', en: 'A.' } }], 'en') as any;
    expect(s.mainEntity).toEqual([{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } }]);
  });
});

describe('schemaFilAriane', () => {
  it('numérote les étapes à partir de 1', () => {
    const s = schemaFilAriane([{ nom: 'Accueil', url: 'https://a/' }, { nom: 'Soins', url: 'https://a/soins/' }]) as any;
    expect(s.itemListElement.map((e: any) => e.position)).toEqual([1, 2]);
    expect(s.itemListElement[1]).toMatchObject({ name: 'Soins', item: 'https://a/soins/' });
  });
});
