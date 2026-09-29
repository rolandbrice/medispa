import type { Lang } from './i18n';
import { formaterJour, type Creneau } from './horaires';

export function lienWhatsApp(numero: string, message: string): string {
  return `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

const MOMENTS: Record<Lang, Record<Creneau, string>> = {
  fr: { matin: 'le matin', 'apres-midi': "l'après-midi", soir: 'en soirée' },
  en: { matin: 'in the morning', 'apres-midi': 'in the afternoon', soir: 'in the evening' },
};

export type DemandeReservation = { soin: string; formule?: string; prix?: string; jour: Date; creneau: Creneau; prenom: string };

export function messageReservation(d: DemandeReservation, lang: Lang): string {
  const soin = [d.soin, d.formule, d.prix].filter(Boolean).join(', ');
  const quand = `${formaterJour(d.jour, lang)}, ${MOMENTS[lang][d.creneau]}`;
  const prenom = d.prenom.trim();
  return lang === 'fr'
    ? `Bonjour MEDI-SPA Saly,\nJe souhaite réserver : ${soin}\nQuand : ${quand}\nPrénom : ${prenom}\nMerci de me confirmer l'horaire.`
    : `Hello MEDI-SPA Saly,\nI would like to book: ${soin}\nWhen: ${quand}\nName: ${prenom}\nPlease confirm the time.`;
}

export type DemandeCadeau = { offre: string; de: string; pour: string; mot?: string };

export function messageCarteCadeau(d: DemandeCadeau, lang: Lang): string {
  const mot = d.mot?.trim();
  const lignes =
    lang === 'fr'
      ? ['Bonjour MEDI-SPA Saly,', `Je souhaite offrir une carte cadeau : ${d.offre}`, `De la part de : ${d.de.trim()}`, `Pour : ${d.pour.trim()}`, mot && `Message : « ${mot} »`, 'Comment puis-je régler (Wave, Orange Money, espèces) ?']
      : ['Hello MEDI-SPA Saly,', `I would like to offer a gift card: ${d.offre}`, `From: ${d.de.trim()}`, `To: ${d.pour.trim()}`, mot && `Message: "${mot}"`, 'How can I pay (Wave, Orange Money, cash)?'];
  return lignes.filter(Boolean).join('\n');
}

export function messageInfo(sujet: string | undefined, lang: Lang): string {
  if (lang === 'fr') return sujet ? `Bonjour MEDI-SPA Saly, je souhaite des informations sur : ${sujet}.` : 'Bonjour MEDI-SPA Saly, je souhaite des informations.';
  return sujet ? `Hello MEDI-SPA Saly, I would like some information about: ${sujet}.` : 'Hello MEDI-SPA Saly, I would like some information.';
}
