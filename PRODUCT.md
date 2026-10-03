# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Apprenants (public prioritaire)** : salariés d'une organisation, de tous niveaux techniques, répartis en profils (utilisateur standard, manager et direction, administrateur informatique, nouvel arrivant, télétravailleur et nomade). Ils suivent des modules courts entre deux tâches, souvent sans motivation initiale forte, parfois sur mobile, et une partie d'entre eux est en situation de handicap (basse vision, dyslexie, surdité, troubles cognitifs, navigation clavier ou lecteur d'écran). Quand les besoins entrent en conflit, **les apprenants priment**.
- **Équipe sécurité / RSSI** : pilote le programme (tableau de bord par profil, calendrier, plan exportable).
- **Jury de certification RNCP** (oral, juillet 2027) : évalue la plateforme comme preuve d'un plan de sensibilisation ; il lit le plan, parcourt les pages et vérifie l'accessibilité et la sécurité.

## Product Purpose

Plateforme générique de sensibilisation et de formation des utilisateurs à la sécurité du système d'information. Elle propose des parcours par profil, calculés à partir de l'analyse de risques de l'organisation, et mesure la progression (pré-test, post-test, mises en situation). Réussir, c'est : un apprenant comprend et retient les bons réflexes (reconnaître, protéger, signaler) ; le RSSI pilote et renouvelle les actions ; le jury constate que chacun des 6 critères (profils, objectifs, risques et nouvelles technologies, moyens variés et accessibles, évaluation, fréquence) est démontré.

## Positioning

Tout ce qui est propre à une organisation vient d'un seul fichier de configuration (`config/organisation.json`) : changer d'organisation, c'est régénérer le site, les parcours, le calendrier et le plan. Les parcours sont justifiés par l'analyse de risques (« Pourquoi ce module ? »). L'accessibilité (RGAA AA, version FALC de chaque module) et la sécurité de l'application (site statique, CSP stricte) sont des propriétés du produit, pas des options.

## Operating Context

- Démonstration publique sur Cloudflare (ressources statiques), avec données de suivi fictives ; aucune collecte réelle, progression conservée dans le navigateur.
- Contenus en Markdown / JSON (`contenus/`), modifiables sans code ; interface en français, version anglaise sous `/en/`.
- Usage réel visé : modules de 8 à 15 minutes, campagnes trimestrielles, simulation d'hameçonnage affichée dans la plateforme (aucun e-mail envoyé).
- Sera adaptée plus tard à une organisation réelle (celle du dossier de certification).

## Capabilities and Constraints

- Astro (site statique) + TypeScript natif, sans framework client ; aucun script ni style inline (CSP `script-src 'self'; style-src 'self'`), aucune ressource externe (polices hébergées localement).
- Pages : accueil, profils et parcours, catalogue et pages de modules (standard / FALC), ma progression, calendrier, tableau de bord RSSI, plan exporté, préférences d'affichage, déclaration d'accessibilité.
- Préférences utilisateur : taille du texte jusqu'à 200 %, polices Atkinson Hyperlegible et OpenDyslexic, espacement du texte, thèmes clair / sombre / contraste renforcé, animations réduites, FALC par défaut.
- Couleurs de l'organisation vérifiées automatiquement (contraste ≥ 4,5:1) et corrigées si besoin.
- Tests automatisés : axe-core sur toutes les pages, parcours clavier, CSP, 320 px.
- Aucune limite de temps dans les activités.

## Brand Commitments

- La plateforme peut porter **sa propre identité visuelle** ; l'organisation y apporte son nom, son logo et ses couleurs (primaire, secondaire) via la configuration, sans casser cette identité.
- Ton : bienveillant et sans culpabilisation (« pas de honte, mais pas de délai »), concret, en français clair ; vouvoiement.
- Aucune marque réelle imitée dans les mises en situation.

## Evidence on Hand

- 8 modules génériques complets (M1 à M8), un module sectoriel santé (S1), 5 profils, un catalogue de 12 risques dont 3 émergents (`contenus/`).
- Audio synthétique du module M3 avec sous-titres et transcription (`public/medias/`).
- Captures d'écran (`docs/captures/`), plan exporté (`npm run plan`).
- **Absent, à ne pas inventer** : témoignages, organisations clientes, statistiques réelles de participation (le tableau de bord est fictif et le dit), audit RGAA manuel (prévu au printemps 2027).

## Product Principles

1. L'apprenant d'abord : chaque écran doit être compris en quelques secondes par une personne pressée, non technicienne, éventuellement en situation de handicap.
2. Accessible par construction : aucune amélioration visuelle ne doit dégrader le RGAA AA, les préférences d'affichage ou la version FALC.
3. Expliquer plutôt qu'imposer : chaque priorité, score ou parcours montre sa justification.
4. Générique et paramétrable : rien de propre à une organisation dans le code.
5. Sobre et sûr : pas de dépendance ni de ressource externe superflue ; la CSP stricte n'est jamais assouplie pour un effet visuel.

## Accessibility & Inclusion

Conformité visée RGAA 4.1 / WCAG 2.2 niveau AA (critère noté par le jury) : navigation 100 % clavier, focus visible, contrastes ≥ 4,5:1, compatibilité NVDA et VoiceOver, aucune information portée par la seule couleur, aucune limite de temps, version FALC de chaque module, sous-titres et transcriptions, graphiques doublés de tableaux.
