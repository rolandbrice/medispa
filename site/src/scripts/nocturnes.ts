import { estPassee } from '../lib/nocturnes';

// Une démo construite il y a des semaines ne doit pas annoncer une nocturne déjà passée.
const maintenant = new Date();
document.querySelectorAll<HTMLElement>('[data-fin]').forEach((el) => {
  if (el.dataset.fin && estPassee(el.dataset.fin, maintenant)) el.remove();
});
