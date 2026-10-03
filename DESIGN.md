---
name: Sensibilisation à la sécurité numérique
description: Le jeu « Attaque / Parade » – s'entraîner aux bons réflexes face aux cyberattaques
colors:
  fond: "#FFFFFF"
  surface: "#F3F4F6"
  texte: "#1A1C1E"
  texte-attenue: "#4A4F56"
  bordure: "#6B7178"
  attaque: "#B42318"
  attaque-teinte: "#FDEDEA"
  parade: "#16703A"
  parade-teinte: "#E5F3EA"
  avertissement: "#8A5300"
  primaire-organisation: "#1F4E79"
  fond-sombre: "#15171A"
  surface-sombre: "#212429"
  attaque-sombre: "#FF9C8F"
  parade-sombre: "#7DD8A0"
typography:
  display:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "clamp(2.125rem, 1.7rem + 1.6vw, 2.875rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "0.005em"
  titre-2:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.1
  titre-carte:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
    lineHeight: 1.1
  libelle:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  body:
    fontFamily: "'Barlow', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  etiquette: "999px"
  champ: "6px"
  encart: "10px"
  etape: "12px"
  carte-mini: "14px"
  carte: "18px"
  jeu: "22px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "36px"
  xxl: "48px"
components:
  carte-attaque-entete:
    backgroundColor: "{colors.attaque}"
    textColor: "{colors.fond}"
    typography: "{typography.libelle}"
    padding: "9px 16px 16px"
  carte-parade-entete:
    backgroundColor: "{colors.parade}"
    textColor: "{colors.fond}"
    typography: "{typography.libelle}"
    padding: "9px 16px"
  carte:
    backgroundColor: "{colors.fond}"
    rounded: "{rounded.carte}"
  bouton-principal:
    backgroundColor: "{colors.primaire-organisation}"
    textColor: "{colors.fond}"
    rounded: "{rounded.champ}"
    padding: "8px 18px"
  bouton-signaler:
    backgroundColor: "{colors.parade}"
    textColor: "{colors.fond}"
    rounded: "{rounded.champ}"
  etiquette-attaque:
    backgroundColor: "{colors.attaque-teinte}"
    textColor: "{colors.attaque}"
    rounded: "{rounded.etiquette}"
---

# Design System: Sensibilisation à la sécurité numérique

## Overview

**Le jeu « Attaque / Parade ».** La plateforme traite chaque réflexe de sécurité comme un geste qui s'entraîne. Chaque menace réelle est une **carte attaque**, chaque bon réflexe une **carte parade** ; valider un module, c'est gagner ses parades et les ajouter à son jeu personnel. L'inspiration vient des jeux de cartes familiers (attaques et parades), jamais d'une marque existante.

Le registre reste celui d'un outil de formation pour adultes : surfaces neutres et calmes, deux familles de couleur qui portent le sens, typographie condensée et affirmée pour la « voix » du jeu, texte courant très lisible. La couleur de l'organisation (configurable) garde la navigation et les actions ; le jeu possède ses propres couleurs.

Accessibilité par construction : chaque famille de cartes se distingue **sans la couleur** (libellé écrit, pictogramme, motif d'en-tête), les trois thèmes (clair, sombre, contraste renforcé) sont composés séparément, et les préférences d'accessibilité remplacent l'identité visuelle (police, animations).

## Colors

Stratégie **retenue (« restrained »)** : neutres + deux familles sémantiques, présentes seulement là où il y a une menace ou un réflexe.

### Primary

La couleur primaire de l'organisation (`primaire-organisation`, configurable dans `config/organisation.json`, contraste ≥ 4,5:1 vérifié et corrigé automatiquement) : navigation active, liens, bouton principal, focus de sélection.

### Secondary

- **Attaque** (`attaque` / `attaque-teinte`) : menaces, réponses incorrectes, « nouvelle menace ».
- **Parade** (`parade` / `parade-teinte`) : réflexes, réponses correctes, parades gagnées, bouton « Signaler ».

### Neutral

Fond blanc, surface gris très clair, texte presque noir, texte atténué gris foncé (≥ 7:1), bordures gris moyen (≥ 3:1). Thème sombre : fond `#15171A`, surface `#212429`, familles éclaircies (`attaque-sombre`, `parade-sombre`). Contraste renforcé : noir, blanc, jaune, rouge clair et vert clair.

### Named Rules

- **Jamais la couleur seule** : attaque = libellé « ATTAQUE » + triangle + bande hachurée ; parade = « PARADE » + bouclier coché + aplat ; à gagner = pointillés + carte « ? ».
- **Le jeu n'emprunte pas la couleur de l'organisation** et l'organisation n'emprunte pas celles du jeu.

## Typography

- **Affichage** : Barlow Condensed 600/700 (OFL, hébergée localement) pour les titres, cartes, navigation, boutons, libellés.
- **Texte** : Barlow 400/600/700.
- Préférences : Atkinson Hyperlegible Next ou OpenDyslexic **remplacent les deux familles**.

### Hierarchy

Display (h1, fluide 34–46 px) → titre 2 (30 px) → titre de carte (23 px) → titre 3 (22 px, 600) → texte (17 px, interligne 1,6) → libellé (14 px, capitales, espacement 0,08 em). Chiffres tabulaires pour les compteurs et tableaux. Titres équilibrés (`text-wrap: balance`), mots courts à trait d'union insécables (« e-mail »).

## Layout

Colonne de lecture d'environ 46 rem pour le texte ; grilles en `auto-fill` pour les cartes (min. 10,5 à 21 rem selon le contexte). Rythme : groupes serrés (4–8 px), séparations généreuses (36–48 px), plus d'espace au-dessus d'un titre qu'en dessous. Module : duel en tête, puis fil d'étapes et **une étape à la fois** (adresse par étape). Petits écrans : une colonne, menu repliable, contenu dès ~190 px.

## Elevation & Depth

Ombres rares et douces, toujours décalées vers le bas : cartes de jeu (`0 12px 28px -18px`), bloc « Votre jeu » (ombre teintée parade). Aucune ombre dure, aucun halo.

## Shapes

Coins arrondis croissants avec l'importance : champs 6 px, encarts 10 px, étapes 12 px, mini-cartes 14 px, cartes 18 px, bloc « Votre jeu » 22 px, étiquettes en pilule.

## Components

### Buttons

Principal : aplat couleur de l'organisation, texte condensé. Secondaire : contour. « Signaler » (simulation) : aplat parade. Cible minimale 44 px. État pressé : coche + contour (jamais la couleur seule).

### Chips

Étiquettes en pilule avec pictogramme : « Nouvelle menace » (attaque), parade.

### Cards / Containers

**Carte de jeu** (`CarteJeu.astro`) : en-tête de famille (libellé + pictogramme), corps (titre condensé, texte, pied). Variantes : attaque (bande hachurée), parade, cachée (pointillés, dos de carte). Mini-cartes du parcours à l'accueil. Encarts : cadre fin, sans bordure gauche épaisse.

### Inputs / Fields

Boutons radio et cases à cocher natifs, agrandis (1,3–1,4 rem), `accent-color` de l'organisation ; chaque question est un `fieldset` / `legend`.

### Navigation

Liens condensés, page active soulignée (bureau) ou marquée à gauche (mobile) ; menu repliable sous 48 rem avec `aria-expanded`.

### Duel (signature)

En tête de module : carte attaque du risque principal « contre » la carte parade à gagner (face cachée). Quand le post-test est validé, la parade se retourne (0,7 s, ease-out exponentielle ; supprimée si animations réduites) et le gain est annoncé aux lecteurs d'écran.

## Do's and Don'ts

### Do:

- Faire porter le sens par un libellé et un pictogramme en plus de la couleur.
- Vérifier chaque nouvelle couleur à 4,5:1 dans les trois thèmes.
- Garder les textes du jeu traduisibles (dictionnaire, JSON `{ "fr", "en" }`).
- Dessiner les pictogrammes en SVG (grille 24 px, trait 2) et les appliquer en masque CSS.

### Don't:

- Pas de look casino ou poker, pas de confettis ni de mascotte, pas de classement entre collègues, pas de chronomètre.
- Pas d'imitation d'un jeu de marque (nom ou visuel).
- Pas de script ni de style inline (CSP stricte), pas de police ou d'image externe.
- Pas de bordure gauche épaisse sur les encarts, pas de texte en dégradé, pas de caractères Unicode en guise d'icônes.
