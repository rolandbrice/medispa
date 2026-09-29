import { formaterJour, formaterJourCourt, prochainsJours, type Creneau, type Horaires } from '../lib/horaires';
import type { Lang } from '../lib/i18n';
import { lienWhatsApp, messageReservation } from '../lib/whatsapp';

type Formule = { nom: string; prix: string | null };
type Option = { id: string; titre: string; formules: Formule[] };
type Champ = 'soin' | 'formule' | 'jour' | 'creneau' | 'prenom';
type Donnees = { lang: Lang; whatsapp: string; horaires: Horaires; options: Option[]; textes: { indispo: string; erreurs: Record<Champ, string> } };

const form = document.querySelector<HTMLFormElement>('#form-resa');
const brut = document.querySelector('#donnees-resa')?.textContent;
if (form && brut) initialiser(form, JSON.parse(brut) as Donnees);

function pastille(nom: string, valeur: string, contenu: (HTMLElement | string)[], desactive = false, classe = 'pastille') {
  const label = document.createElement('label');
  label.className = classe;
  const input = document.createElement('input');
  Object.assign(input, { type: 'radio', name: nom, value: valeur, className: 'sr-only', disabled: desactive });
  label.append(input, ...contenu);
  return label;
}

function span(texte: string, classe: string) {
  const s = document.createElement('span');
  s.className = classe;
  s.textContent = texte;
  return s;
}

function initialiser(form: HTMLFormElement, d: Donnees) {
  form.hidden = false;
  document.querySelector('#resa-sans-js')?.remove();

  const zoneFormules = form.querySelector<HTMLElement>('#formules')!;
  const zoneJours = form.querySelector<HTMLElement>('#jours')!;
  const erreur = form.querySelector<HTMLElement>('#erreur-resa')!;
  const recap = (id: string) => form.querySelector<HTMLElement>(`#recap-${id}`)!;
  const creneaux = [...form.querySelectorAll<HTMLInputElement>('input[name="creneau"]')];
  const valeur = (nom: string) => (form.querySelector<HTMLInputElement>(`input[name="${nom}"]:checked`)?.value ?? null);
  const jours = prochainsJours(new Date(), d.horaires);

  zoneJours.replaceChildren(
    ...jours.map(({ iso, date, creneaux: dispo }) => {
      const c = formaterJourCourt(date, d.lang);
      const el = pastille('jour', iso, [span(c.jour, 'text-[13px]'), span(c.num, 'font-serif text-2xl leading-none'), span(c.mois, 'text-[13px]')], dispo.length === 0, 'pastille pastille-jour');
      if (!dispo.length) el.title = d.textes.indispo;
      return el;
    }),
  );

  const optionChoisie = () => d.options.find((o) => o.id === valeur('soin'));

  function afficherFormules() {
    const option = optionChoisie();
    zoneFormules.replaceChildren(
      ...(option?.formules ?? []).map((f, i) =>
        pastille('formule', String(i), [span(f.nom, ''), ...(f.prix ? [span(f.prix, 'text-sm opacity-70')] : [])], false, 'pastille justify-between text-left'),
      ),
    );
    if (option?.formules.length === 1) zoneFormules.querySelector<HTMLInputElement>('input')!.checked = true;
  }

  function majCreneaux() {
    const dispo = jours.find((j) => j.iso === valeur('jour'))?.creneaux ?? [];
    for (const input of creneaux) {
      input.disabled = !dispo.includes(input.value as Creneau);
      if (input.disabled) input.checked = false;
    }
  }

  function majRecap() {
    const option = optionChoisie();
    const formule = option?.formules[Number(valeur('formule'))];
    const iso = valeur('jour');
    recap('soin').textContent = option?.titre ?? '—';
    recap('formule').textContent = formule ? [formule.nom, formule.prix].filter(Boolean).join(', ') : '—';
    recap('jour').textContent = iso ? formaterJour(new Date(`${iso}T00:00:00Z`), d.lang) : '—';
    recap('creneau').textContent = form.querySelector<HTMLInputElement>('input[name="creneau"]:checked')?.parentElement?.textContent?.trim() ?? '—';
  }

  form.addEventListener('change', (e) => {
    const nom = (e.target as HTMLInputElement).name;
    if (nom === 'soin') afficherFormules();
    if (nom === 'jour') majCreneaux();
    erreur.textContent = '';
    majRecap();
  });

  // Présélection depuis une fiche soin ou un rituel : /reserver/?soin=massage-saly
  const preselection = new URLSearchParams(location.search).get('soin');
  const radio = [...form.querySelectorAll<HTMLInputElement>('input[name="soin"]')].find((r) => r.value === preselection);
  if (radio) {
    radio.checked = true;
    afficherFormules();
    majRecap();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const option = optionChoisie();
    const indexFormule = valeur('formule');
    const iso = valeur('jour');
    const creneau = valeur('creneau') as Creneau | null;
    const prenom = form.querySelector<HTMLInputElement>('#prenom')!.value.trim();
    const manque: Champ | null = !option ? 'soin' : indexFormule === null ? 'formule' : !iso ? 'jour' : !creneau ? 'creneau' : !prenom ? 'prenom' : null;
    if (manque) {
      erreur.textContent = d.textes.erreurs[manque];
      const cible = manque === 'prenom' ? form.querySelector<HTMLElement>('#prenom') : form.querySelector<HTMLElement>(`input[name="${manque}"]:not(:disabled)`);
      cible?.focus();
      return;
    }
    const formule = option!.formules[Number(indexFormule)];
    const message = messageReservation(
      { soin: option!.titre, formule: formule.nom || undefined, prix: formule.prix ?? undefined, jour: new Date(`${iso}T00:00:00Z`), creneau: creneau!, prenom },
      d.lang,
    );
    const lien = lienWhatsApp(d.whatsapp, message);
    const fenetre = window.open(lien, '_blank');
    if (fenetre) fenetre.opener = null;
    else location.href = lien;
  });
}
