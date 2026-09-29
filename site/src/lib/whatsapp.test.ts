import { describe, expect, it } from 'vitest';
import { lienWhatsApp, messageCarteCadeau, messageInfo, messageReservation } from './whatsapp';

const texteDe = (url: string) => new URL(url).searchParams.get('text');
const samedi = new Date('2026-10-03T00:00:00Z');

describe('lienWhatsApp', () => {
  it('ne garde que les chiffres du numéro', () => {
    expect(lienWhatsApp('+221 78 595 15 15', 'x').startsWith('https://wa.me/221785951515?text=')).toBe(true);
  });
  it('transmet accents, &, emoji et retours à la ligne sans perte', () => {
    const message = 'Aïssatou & Awa 😊\nligne 2 : « merci » #1 ?';
    expect(texteDe(lienWhatsApp('221785951515', message))).toBe(message);
  });
});

describe('messageReservation', () => {
  it('rédige une demande complète en français', () => {
    const m = messageReservation(
      { soin: 'Massage', formule: '60 min', prix: '20 000 FCFA', jour: samedi, creneau: 'apres-midi', prenom: '  Awa ' },
      'fr',
    );
    expect(m).toBe(
      "Bonjour MEDI-SPA Saly,\nJe souhaite réserver : Massage — 60 min (20 000 FCFA)\nQuand : samedi 3 octobre, l'après-midi\nPrénom : Awa\nMerci de me confirmer l'horaire.",
    );
  });
  it('omet formule et prix quand ils manquent (soin sur devis)', () => {
    const m = messageReservation({ soin: 'Kinésithérapie', jour: samedi, creneau: 'matin', prenom: 'Fatou' }, 'fr');
    expect(m).toContain('Je souhaite réserver : Kinésithérapie\n');
    expect(m).not.toContain('()');
    expect(m).not.toContain('undefined');
  });
  it('rédige en anglais sur la version EN', () => {
    const m = messageReservation({ soin: 'Massage', formule: '60 min', jour: samedi, creneau: 'soir', prenom: 'Emma' }, 'en');
    expect(m).toBe('Hello MEDI-SPA Saly,\nI would like to book: Massage — 60 min\nWhen: Saturday 3 October, in the evening\nName: Emma\nPlease confirm the time.');
  });
});

describe('messageCarteCadeau', () => {
  it('inclut le mot quand il est fourni', () => {
    const m = messageCarteCadeau({ offre: '50 000 FCFA', de: 'Awa', pour: 'Maman', mot: ' Joyeux anniversaire ! ' }, 'fr');
    expect(m).toBe(
      'Bonjour MEDI-SPA Saly,\nJe souhaite offrir une carte cadeau : 50 000 FCFA\nDe la part de : Awa\nPour : Maman\nMessage : « Joyeux anniversaire ! »\nComment puis-je régler (Wave, Orange Money, espèces) ?',
    );
  });
  it('n’ajoute pas de ligne Message quand le mot est vide', () => {
    expect(messageCarteCadeau({ offre: 'Teranga Glow', de: 'A', pour: 'B', mot: '   ' }, 'en')).not.toContain('Message');
  });
});

describe('messageInfo', () => {
  it('cite le sujet quand il existe', () => {
    expect(messageInfo('Hammam & gommage', 'fr')).toBe('Bonjour MEDI-SPA Saly, je souhaite des informations sur : Hammam & gommage.');
    expect(messageInfo(undefined, 'en')).toBe('Hello MEDI-SPA Saly, I would like some information.');
  });
});
