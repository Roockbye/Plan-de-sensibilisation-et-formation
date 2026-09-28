{{organisation.nom}} s'engage à rendre ses services numériques accessibles, conformément à l'article 47 de la loi n° 2005-102 du 11 février 2005.

Cette déclaration d'accessibilité s'applique à la plateforme de sensibilisation à la sécurité numérique.

## État de conformité

La plateforme est **{{accessibilite.etatConformite}}** avec le référentiel général d'amélioration de l'accessibilité (RGAA), version 4.1.2, qui transpose les critères de niveau AA des WCAG.

{{accessibilite.dateAudit}}

## Mesures mises en œuvre

- Navigation complète au clavier, liens d'évitement, focus toujours visible.
- Structure de titres et régions de page (en-tête, navigation, contenu, pied de page) pour les lecteurs d'écran.
- Contrastes d'au moins 4,5:1 : les couleurs de l'organisation sont **vérifiées automatiquement** à chaque génération du site et corrigées si nécessaire.
- Aucune information transmise uniquement par la couleur : chaque statut est aussi indiqué par un texte.
- Aucune limite de temps dans les quiz et les mises en situation.
- Version **facile à lire et à comprendre (FALC)** de chaque module.
- Préférences d'affichage : taille du texte jusqu'à 200 %, police adaptée à la basse vision ou à la dyslexie, espacement du texte augmenté, thème sombre, contraste renforcé, réduction des animations.
- Transcription textuelle et sous-titres pour tout contenu audio ou vidéo.
- Graphiques du tableau de bord toujours accompagnés d'un tableau de données.
- Tests automatisés (axe-core) de chaque page à chaque modification du code.

## Contenus non accessibles

- Les simulations interactives (quiz, mises en situation) nécessitent JavaScript. Le contenu pédagogique de chaque module reste consultable sans JavaScript.
- Un audit manuel complet avec lecteurs d'écran (NVDA, VoiceOver) reste à réaliser : l'état de conformité sera mis à jour à son issue.

## Technologies utilisées

HTML5, CSS, JavaScript (amélioration progressive), WAI-ARIA lorsque nécessaire.

## Environnement de test

Tests automatisés : axe-core via Playwright (Chromium). Vérifications manuelles recommandées : NVDA avec Firefox (Windows), VoiceOver avec Safari (macOS, iOS), navigation au clavier seul, zoom à 200 %.

## Retour d'information et contact

Si vous n'arrivez pas à accéder à un contenu ou à un service, contactez-nous : {{contacts.accessibilite}}. Nous vous proposerons une alternative accessible.

## Voies de recours

Si vous avez signalé un défaut d'accessibilité qui vous empêche d'accéder à un contenu et que vous n'avez pas obtenu de réponse satisfaisante, vous pouvez saisir le Défenseur des droits (formulaire en ligne, délégué territorial ou courrier gratuit : Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07).
