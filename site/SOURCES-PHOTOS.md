# Sources des photos

> Photos réelles utilisées uniquement pour la démo privée. **Accord écrit de la gérante à obtenir avant mise en ligne publique.**

Toutes les images de `src/assets/photos/` sont produites par `python3 scripts/photos.py` à partir de `photos-sources/` (recadrage et étalonnage chaud commun).

| Fichier | Origine | URL | Licence | Statut |
|---|---|---|---|---|
| `cabine-haut.jpg` | Affiche « Nocturnes » du spa (moitié haute du sablier, recadrée) | Facebook Médi-Spa Saly (fournie dans le dossier de prospection) | Propriété MEDI-SPA Saly | À valider à la signature |
| `cabine-arche.jpg` | Affiche « Nocturnes » du spa (moitié basse du sablier, recadrée) | idem | Propriété MEDI-SPA Saly | À valider à la signature |
| `facade.jpg` | Fiche Google Maps « MEDI-SPA Saly » (photo de la façade) | https://maps.google.com/?cid=2170848878231110383 | Auteur non identifié (propriétaire ou client) | À valider, sinon remplacer par une photo fournie par le spa |
| `ambiance-1.jpg` | Fiche Google Maps « MEDI-SPA Saly » (entrée du spa) | idem | Auteur non identifié (propriétaire ou client) | À valider, sinon remplacer |
| `ambiance-2.jpg` | Unsplash — Kaeme | https://unsplash.com/photos/a-man-and-a-woman-laying-on-a-bed-next-to-each-other-YgmDZXzl5Z8 | Unsplash License | OK |
| `amincissement.jpg` | Unsplash — Rosa Rafael | https://unsplash.com/photos/woman-massaged-cJwl8182Mjs | Unsplash License | OK |
| `balneo.jpg` | Unsplash — Zoe Stefanatou | https://unsplash.com/photos/a-pool-with-a-chair-and-a-table-in-the-background-nExQ7m1ZRmU | Unsplash License | OK |
| `epilation.jpg` | Unsplash — Soweto Graphics | https://unsplash.com/photos/a-person-covering-the-face-with-the-hands-k0HHFNHT6YA | Unsplash License | OK |
| `hammam.jpg` | Unsplash — Modern Pools | https://unsplash.com/photos/a-bathroom-with-a-black-and-white-tiled-wall-ZrsbryXFiG0 | Unsplash License | OK |
| `hero.jpg` | Unsplash — Jabari Timothy | https://unsplash.com/photos/a-person-with-the-eyes-closed-R33u_uiD8ko | Unsplash License | OK |
| `kine.jpg` | Unsplash — Benjamin Wedemeyer | https://unsplash.com/photos/woman-in-black-and-white-tank-top-1rdB14ttWgQ | Unsplash License | OK |
| `massage.jpg` | Unsplash — Iwaria Inc. | https://unsplash.com/photos/a-woman-getting-a-back-massage-at-a-beauty-salon-VWELT4w5jj8 | Unsplash License | OK |
| `visage.jpg` | Unsplash — Iwaria Inc. | https://unsplash.com/photos/a-woman-getting-a-facial-mask-on-her-face-TLLro7iVLtk | Unsplash License | OK |

## Notes

- **Facebook** : la page n'a pas pu être consultée (domaine non autorisé pour l'automatisation du navigateur). Aucune photo Facebook supplémentaire n'a été reprise.
- **Google Maps** : consultation sans compte, donc seuls 3 avis sont visibles. Les 2 avis 5★ complets sont recopiés mot pour mot dans `src/content/avis.json`. Les autres photos de la fiche montraient des établissements voisins (NARÉLI, Chez Louise, Sabai Thong) et ont été écartées.
- L'affiche des Nocturnes elle-même n'est pas publiée : ses dates (décembre) sont passées.
- `photos-sources/_non-utilisees/facade-route.jpg` : ancienne photo de façade prise depuis la route, remplacée par la version Google Maps.
