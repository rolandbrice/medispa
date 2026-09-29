import { z } from 'astro/zod';
import brut from '../data/site.json';
import type { Horaires } from './horaires';
import type { Nocturne } from './nocturnes';

const texte = z.object({ fr: z.string().min(1), en: z.string().min(1) });
const heure = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const plage = z.tuple([heure, heure]).nullable();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const schemaSite = z.object({
  demo: z.boolean(),
  nom: z.string().min(1),
  telephone: z.string().min(1),
  whatsapp: z.string().regex(/^\d{11,15}$/, 'chiffres uniquement, indicatif compris (ex. 221785951515)'),
  email: z.email(),
  instagram: z.url(),
  facebook: z.url().optional(),
  adresse: texte,
  rue: z.string().min(1),
  ville: z.string().min(1),
  horaires: z.object({ lun: plage, mar: plage, mer: plage, jeu: plage, ven: plage, sam: plage, dim: plage }),
  noteHoraires: texte,
  note: z.number().min(0).max(5),
  nbAvis: z.number().int().nonnegative(),
  ficheGoogle: z.url(),
  lienAvisGoogle: z.url(),
  requeteMaps: z.string().min(1),
  nocturnes: z.array(
    z
      .object({ debut: date, fin: date, heures: z.tuple([heure, heure]), quand: texte })
      .refine((n) => n.debut <= n.fin, 'la fin d’une nocturne précède son début'),
  ),
});

export type Site = Omit<z.infer<typeof schemaSite>, 'horaires' | 'nocturnes'> & { horaires: Horaires; nocturnes: Nocturne[] };

/** Validé au chargement : un site.json invalide fait échouer le build. */
export const site: Site = schemaSite.parse(brut);

export const telHref = () => `tel:${site.telephone.replace(/\s/g, '')}`;
