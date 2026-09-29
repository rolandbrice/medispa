import { validerMontant } from '../lib/cadeau';
import type { Lang } from '../lib/i18n';
import { formaterPrix } from '../lib/prix';
import { lienWhatsApp, messageCarteCadeau } from '../lib/whatsapp';

type Erreur = 'vide' | 'invalide' | 'trop-bas' | 'trop-haut' | 'de' | 'pour';
type Donnees = { lang: Lang; whatsapp: string; rituels: { id: string; libelle: string }[]; textes: { vide: string; erreurs: Record<Erreur, string> } };

const form = document.querySelector<HTMLFormElement>('#form-cadeau');
const brut = document.querySelector('#donnees-cadeau')?.textContent;
if (form && brut) initialiser(form, JSON.parse(brut) as Donnees);

function initialiser(form: HTMLFormElement, d: Donnees) {
  const apercu = document.querySelector<HTMLElement>('#apercu')!;
  const erreur = form.querySelector<HTMLElement>('#erreur-cadeau')!;
  const champ = (id: string) => form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
  const coche = (nom: string) => form.querySelector<HTMLInputElement>(`input[name="${nom}"]:checked`)?.value ?? '';
  const groupe = (nom: string) => form.querySelector<HTMLElement>(`[data-groupe="${nom}"]`)!;
  const ecrire = (nom: string, texte: string) => {
    const el = apercu.querySelector<HTMLElement>(`[data-champ="${nom}"]`);
    if (el) el.textContent = texte;
  };

  /** Ce qu'on offre, prêt à afficher ; `erreur` si le montant libre est invalide. */
  function offre(): { texte: string } | { erreur: Erreur } {
    if (coche('type') === 'rituel') return { texte: d.rituels.find((r) => r.id === coche('rituel'))?.libelle ?? d.textes.vide };
    if (coche('montant') !== 'libre') return { texte: formaterPrix(Number(coche('montant')), d.lang) };
    const r = validerMontant(champ('montant-libre').value);
    return r.ok ? { texte: formaterPrix(r.montant, d.lang) } : { erreur: r.erreur };
  }

  function maj() {
    const estRituel = coche('type') === 'rituel';
    groupe('montant').hidden = estRituel;
    groupe('rituel').hidden = !estRituel;
    groupe('libre').hidden = estRituel || coche('montant') !== 'libre';
    const o = offre();
    ecrire('offre', 'texte' in o ? o.texte : d.textes.vide);
    ecrire('pour', champ('pour').value.trim() || d.textes.vide);
    ecrire('de', champ('de').value.trim() || d.textes.vide);
    ecrire('mot', champ('mot').value.trim());
  }

  form.addEventListener('input', () => {
    erreur.textContent = '';
    maj();
  });
  form.addEventListener('change', maj);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const o = offre();
    const de = champ('de').value.trim();
    const pour = champ('pour').value.trim();
    const probleme: Erreur | null = 'erreur' in o ? o.erreur : !de ? 'de' : !pour ? 'pour' : null;
    if (probleme) {
      erreur.textContent = d.textes.erreurs[probleme];
      const cible = probleme === 'de' || probleme === 'pour' ? champ(probleme) : champ('montant-libre');
      cible.focus();
      return;
    }
    const message = messageCarteCadeau({ offre: (o as { texte: string }).texte, de, pour, mot: champ('mot').value }, d.lang);
    const lien = lienWhatsApp(d.whatsapp, message);
    const fenetre = window.open(lien, '_blank');
    if (fenetre) fenetre.opener = null;
    else location.href = lien;
  });

  maj();
}
