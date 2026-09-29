import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const texte = z.object({ fr: z.string().min(1), en: z.string().min(1) });
const lignes = z.object({ fr: z.array(z.string().min(1)).min(1), en: z.array(z.string().min(1)).min(1) });
const memesLongueurs = (l: { fr: string[]; en: string[] }) => l.fr.length === l.en.length;

const soins = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/soins' }),
  schema: ({ image }) =>
    z.object({
      ordre: z.number().int(),
      categorie: z.enum(['corps', 'visage', 'eau', 'beaute', 'medi', 'cure']),
      vedette: z.boolean().default(false),
      image: image(),
      imageAlt: texte,
      titre: texte,
      accroche: texte,
      description: texte,
      deroule: lignes.refine(memesLongueurs, 'déroulé : autant de lignes en FR et en EN'),
      bienfaits: lignes.refine(memesLongueurs, 'bienfaits : autant de lignes en FR et en EN'),
      tarifs: z
        .array(z.object({ prix: z.number().int().nonnegative().nullable(), duree: z.string().optional(), libelle: texte.optional() }))
        .min(1),
      faq: z.array(z.object({ q: texte, r: texte })).default([]),
      seo: z.object({ titre: texte, description: texte }),
    }),
});

const rituels = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/rituels' }),
  schema: z.object({
    ordre: z.number().int(),
    nom: texte,
    duree: z.string(),
    contenu: lignes.refine(memesLongueurs, 'contenu : autant de lignes en FR et en EN'),
    prix: z.number().int().positive().nullable(),
    vedette: z.boolean().default(false),
  }),
});

// Avis Google recopiés mot pour mot. Jamais d'avis rédigé ou reformulé.
const avis = defineCollection({
  loader: file('src/content/avis.json'),
  schema: z.object({
    id: z.string(),
    auteur: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}$/),
    note: z.number().int().min(1).max(5),
    texte: z.string().min(1),
    langue: z.enum(['fr', 'en']),
    source: z.literal('google'),
  }),
});

export const collections = { soins, rituels, avis };
