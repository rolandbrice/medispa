import { estPassee } from './nocturnes';

/**
 * Met la page à jour côté navigateur, pour qu'une démo construite il y a des semaines
 * n'annonce pas une nocturne passée :
 * - retire tout élément `[data-fin]` dont la date est passée (bannières, lignes de la liste) ;
 * - affiche la première bannière restante, les autres restent masquées ;
 * - retire le bloc « Prochaines dates » s'il n'a plus de ligne ;
 * - bascule le libellé du bouton (« Réserver ma soirée » / « Demander les prochaines dates »).
 */
export function appliquerNocturnes(racine: ParentNode, maintenant: Date): void {
  racine.querySelectorAll<HTMLElement>('[data-fin]').forEach((el) => {
    if (el.dataset.fin && estPassee(el.dataset.fin, maintenant)) el.remove();
  });

  racine.querySelectorAll<HTMLElement>('[data-banniere-nocturne]').forEach((b, i) => {
    b.hidden = i > 0;
  });

  const listes = [...racine.querySelectorAll<HTMLElement>('[data-nocturnes-liste]')];
  for (const liste of listes) if (!liste.querySelector('[data-fin]')) liste.remove();
  const resteDesDates = racine.querySelector('[data-nocturnes-liste] [data-fin]') !== null;

  racine.querySelectorAll<HTMLElement>('[data-nocturnes-cta]').forEach((cta) => {
    const avenir = cta.querySelector<HTMLElement>('[data-si="avenir"]');
    const aucune = cta.querySelector<HTMLElement>('[data-si="aucune"]');
    if (avenir) avenir.hidden = !resteDesDates;
    if (aucune) aucune.hidden = resteDesDates;
  });
}
