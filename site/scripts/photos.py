"""Prépare les photos du site depuis photos-sources/ vers src/assets/photos/.

Étalonnage commun : léger voile chaud + saturation adoucie, pour que photos réelles
et photos de stock forment une seule famille. Rejouable à volonté.
"""
from pathlib import Path
from PIL import Image, ImageEnhance

SRC, DST = Path('photos-sources'), Path('src/assets/photos')
DST.mkdir(parents=True, exist_ok=True)
TAUPE = (213, 196, 178)
COTE_MAX = 2000


def etalonner(im: Image.Image) -> Image.Image:
    im = im.convert('RGB')
    im = ImageEnhance.Color(im).enhance(0.88)
    im = Image.blend(im, Image.new('RGB', im.size, TAUPE), 0.07)
    return ImageEnhance.Contrast(im).enhance(1.03)


def reduire(im: Image.Image) -> Image.Image:
    im.thumbnail((COTE_MAX, COTE_MAX), Image.LANCZOS)
    return im


def sauver(im: Image.Image, nom: str) -> None:
    im.save(DST / nom, quality=88, optimize=True, progressive=True)
    print(f'{nom:24} {im.size[0]}×{im.size[1]}')


# Vraie cabine : les deux moitiés du sablier de l'affiche (zones mesurées sur l'original 2048×1448).
# Les coins couleur taupe restent hors champ une fois masqués par .arche-inverse / .arche.
affiche = Image.open(SRC / 'affiche-nocturnes.jpg')
sauver(etalonner(affiche.crop((654, 405, 1392, 720))), 'cabine-haut.jpg')
sauver(etalonner(affiche.crop((654, 765, 1394, 1112))), 'cabine-arche.jpg')
sauver(etalonner(Image.open(SRC / 'facade.jpg')), 'facade.jpg')

for f in sorted(SRC.glob('*.jpg')):
    if f.name in {'affiche-nocturnes.jpg', 'facade.jpg'}:
        continue
    nom = f.name.removeprefix('fb-')
    sauver(etalonner(reduire(Image.open(f))), nom)
