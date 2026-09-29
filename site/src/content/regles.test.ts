import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ui } from '../i18n/ui';

// Spec, révision 1, R2.4 : uniquement des faits vérifiables. Ces promesses sur les pratiques du spa
// (hygiène, équipements, gratuités, canaux) ne sont publiées qu'une fois confirmées par la gérante.
const PROMESSES_NON_VERIFIEES = [
  /hygi[eè]ne/i,
  /usage unique|single-use/i,
  /climatis|air-condition/i,
  /fournis?\b|provided/i,
  /thé offert|complimentary tea/i,
  /annoncées sur Instagram|announced on Instagram/i,
];

const dossier = new URL('.', import.meta.url).pathname;
const fichiers = ['soins', 'rituels'].flatMap((d) => readdirSync(join(dossier, d)).map((f) => join(dossier, d, f)));
const textes: [string, string][] = [
  ...fichiers.map((f): [string, string] => [f.split('/content/')[1], readFileSync(f, 'utf8')]),
  ['i18n/ui.ts (fr)', Object.values(ui.fr).join('\n')],
  ['i18n/ui.ts (en)', Object.values(ui.en).join('\n')],
];

describe('contenus publiés', () => {
  it.each(textes)('%s ne contient aucune promesse non vérifiée', (_nom, texte) => {
    const trouvees = PROMESSES_NON_VERIFIEES.filter((motif) => motif.test(texte)).map(String);
    expect(trouvees).toEqual([]);
  });
});
