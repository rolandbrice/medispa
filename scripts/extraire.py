"""Extrait du plan le contenu d'un fichier annoncé par <!-- fichier: chemin -->.

Usage : python3 scripts/extraire.py site/src/lib/site.ts [autre/chemin ...]
Une variante temporaire se désigne par un suffixe : site/src/pages/index.astro#stub-task6
(le fichier écrit est alors site/src/pages/index.astro).
"""
import pathlib, re, sys

PLAN = pathlib.Path(__file__).resolve().parent.parent / 'docs/superpowers/plans/2026-09-28-refonte-medispa.md'
texte = PLAN.read_text(encoding='utf-8')
motif = re.compile(r'<!-- fichier: (\S+) -->\n```[a-z]*\n(.*?)\n```\n', re.S)
blocs = {m.group(1): m.group(2) + '\n' for m in motif.finditer(texte)}

for chemin in sys.argv[1:]:
    if chemin not in blocs:
        sys.exit(f'Introuvable dans le plan : {chemin}')
    cible = PLAN.parent.parent.parent.parent / chemin.split('#')[0]
    cible.parent.mkdir(parents=True, exist_ok=True)
    cible.write_text(blocs[chemin], encoding='utf-8')
    print('écrit', chemin)
