# Stack — MEDI-SPA Saly

| Couche | Choix | Pourquoi |
|---|---|---|
| Site | Astro 7, statique | Pages légères, rapides en 4G à Saly. Pas de base de données à pirater ni de mises à jour PHP. |
| Style | Tailwind 4 | Direction artistique sur mesure, pas de thème générique. |
| Typographie | Young Serif + Hanken Grotesk, auto-hébergées | Aucune dépendance à Google Fonts, affichage immédiat. |
| Images | `astro:assets` (AVIF / WebP, tailles adaptées) | Photos nettes et légères sur téléphone. |
| Contenu | JSON validé par schéma | Tarifs, soins, horaires modifiables sans toucher au code, et erreurs bloquées au build. |
| Réservation | Parcours guidé → message WhatsApp complet | 95 % des clientes de Saly réservent déjà par WhatsApp ; la gérante reçoit soin, formule, prix, jour, moment et prénom. |
| Carte cadeau | Formulaire avec aperçu → WhatsApp, paiement Wave / Orange Money | Pas de paiement à intégrer en phase 1. |
| Langues | FR (`/`) et EN (`/en/`) | Clientèle touristique francophone et anglophone. |
| SEO | Schema.org DaySpa, Service, FAQ, fil d'Ariane ; sitemap ; hreflang | Cible : « massage Saly », « hammam Saly », « spa Saly ». |
| Qualité | Vitest (81 tests) + `npm run verifier` sur les 23 pages | Aucune régression silencieuse. |
| Mises à jour | Par le prestataire, sur demande WhatsApp (forfait maintenance) | La gérante n'a aucun outil à apprendre. |
| Hébergement | Cloudflare Pages ou Netlify | HTTPS automatique, CDN, 0 FCFA par mois. |

**Mesures Lighthouse mobile** (accueil et fiche soin, hors `noindex` de démo) : Performance 100, Accessibilité 100, Bonnes pratiques 100, SEO 100.

## Pourquoi pas WordPress

1. **Maintenance** : pas de mises à jour de plugins ni de failles PHP à surveiller.
2. **Vitesse** : environ 1,5 s en 4G, contre 2 à 4 s pour un WordPress avec constructeur de pages.
3. **Coût** : hébergement gratuit.
4. **Sécurité** : pas de base de données ni de page de connexion à attaquer.

## Limites assumées (phase 2)

- Paiement en ligne intégré.
- Calendrier en temps réel et rappels automatiques J-1.
- Pas d'interface d'administration pour la gérante : c'est un choix commercial, les modifications passent par le forfait maintenance.
