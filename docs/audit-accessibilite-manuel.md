# Grille d'audit manuel d'accessibilité

Les tests automatisés (axe-core) détectent environ un tiers des défauts d'accessibilité. Cette grille complète l'audit par des vérifications **humaines**, au clavier et avec des lecteurs d'écran. Elle suit la structure du **RGAA 4.1** (numéros de critères entre parenthèses) et prévoit environ **3 heures** pour l'ensemble.

Après l'audit, reportez les résultats dans le tableau de synthèse (§ 7), puis mettez à jour :
- `config/organisation.json` → `accessibilite.dateAudit` et `accessibilite.etatConformite` ;
- `contenus/pages/accessibilite.fr.md` → section « Contenus non accessibles ».

---

## 1. Préparation

### Échantillon de pages (RGAA : pages représentatives)

| N° | Page | URL |
| --- | --- | --- |
| P1 | Accueil | `/` |
| P2 | Parcours d'un profil | `/profils/manager/` |
| P3 | Module avec simulation de boîte mail | `/modules/hameconnage/` |
| P4 | Module avec scénario et audio | `/modules/fraude-president/` |
| P5 | Module en version FALC | `/modules/incident/facile/` |
| P6 | Ma progression | `/ma-progression/` |
| P7 | Tableau de bord | `/tableau-de-bord/` |
| P8 | Calendrier | `/calendrier/` |
| P9 | Préférences d'affichage | `/preferences/` |
| P10 | Déclaration d'accessibilité | `/accessibilite/` |

### Environnements de test

| Environnement | Lecteur d'écran | Navigateur |
| --- | --- | --- |
| Windows | NVDA (gratuit, nvaccess.org) | Firefox |
| macOS | VoiceOver (intégré, Cmd + F5) | Safari |
| iOS ou Android | VoiceOver / TalkBack | Safari / Chrome |
| Tous | Aucun (clavier seul) | Navigateur habituel |

Lancez le site avec `npm run build && npm run preview`, puis ouvrez http://127.0.0.1:4321. Avant chaque parcours, **videz la progression** (page « Ma progression » → « Effacer mes résultats »).

### Commandes essentielles

| Action | NVDA (Firefox) | VoiceOver (macOS) |
| --- | --- | --- |
| Lire la suite | Flèche bas | VO + flèche droite (VO = Ctrl + Option) |
| Titre suivant / liste des titres | H / NVDA + F7 | VO + Cmd + H / rotor : VO + U |
| Région suivante | D | rotor : VO + U, puis « Repères » |
| Champ de formulaire suivant | F | VO + Cmd + J |
| Bouton suivant | B | rotor « Commandes de formulaire » |
| Mode formulaire / navigation | NVDA + Espace | automatique |
| Activer un élément | Entrée ou Espace | VO + Espace |

---

## 2. Clavier seul (sans souris ni lecteur d'écran)

Débranchez la souris ou n'y touchez pas.

| # | Vérification | RGAA | Pages | Attendu |
| --- | --- | --- | --- | --- |
| C1 | Premier Tab : « Aller au contenu » visible, Entrée place le focus sur le contenu | 12.7 | Toutes | Lien visible au focus, focus dans `main` |
| C2 | Tous les liens, boutons et champs sont atteignables avec Tab et Maj + Tab | 12.13 | Toutes | Aucun élément inatteignable |
| C3 | Le focus est **toujours visible** et assez contrasté | 10.7 | Toutes | Contour épais autour de l'élément actif |
| C4 | L'ordre de tabulation suit l'ordre visuel | 12.8 | Toutes | Pas de saut incohérent |
| C5 | Aucun piège au clavier (on peut toujours sortir d'un composant) | 12.9 | P3, P4, P9 | On sort du lecteur audio, des quiz… |
| C6 | Quiz : cocher avec Espace, flèches entre choix d'une même question, valider avec Entrée | 11, 7.1 | P3 | Résultat affiché, focus déplacé sur le résultat |
| C7 | Valider un quiz incomplet : la liste des questions manquantes reçoit le focus, chaque lien mène à la question | 11.10, 11.11 | P3 | Liens fonctionnels |
| C8 | Boîte mail : « Vérifier le lien » ouvre et ferme la destination ; « Signaler » affiche le retour et y place le focus | 7.1, 7.3 | P3 | Retour lisible, focus dessus |
| C9 | Scénario : choisir, lire le retour, « Continuer » place le focus sur le titre de l'étape suivante | 7.3 | P4 | Enchaînement jusqu'au bilan |
| C10 | Lecteur audio : lecture, pause et avance au clavier ; la transcription se déplie avec Entrée | 4.1, 4.3 | P4 | Contrôles utilisables |
| C11 | Préférences : changement avec les flèches, effet immédiat | 7.1 | P9 | Message « Préférences enregistrées » |
| C12 | Tableaux défilants : atteignables au Tab et défilables avec les flèches | 12.13 | P7, P8 | Défilement horizontal possible |

## 3. Lecteur d'écran (NVDA puis VoiceOver)

| # | Vérification | RGAA | Pages | Attendu |
| --- | --- | --- | --- | --- |
| L1 | Le titre de la page est annoncé et décrit la page | 8.6 | Toutes | « [Page] – Sensibilisation… – [Organisation] » |
| L2 | Liste des titres : hiérarchie logique, un seul h1, pas de saut de niveau | 9.1 | Toutes | h1 → h2 → h3 cohérents |
| L3 | Liste des régions : bannière, navigation (« Menu principal », « Fil d'Ariane »), principal, informations sur le contenu | 12.6 | Toutes | Régions présentes et nommées |
| L4 | Le lien de navigation de la page courante est annoncé comme « courant » | – | Toutes | « page actuelle » |
| L5 | Le logo n'est pas lu comme une image vide ou un nom de fichier | 1.2 | Toutes | Ignoré ; le nom de l'organisation est lu |
| L6 | Chaque question de quiz est annoncée avec son numéro (« Question 2 sur 5 ») à l'entrée dans le groupe | 11.5, 11.6 | P3 | Légende lue |
| L7 | Après validation, le résultat et chaque correction (« Bonne réponse » / « Réponse incorrecte ») sont lus | 7.3 | P3 | Lus sans avoir à les chercher |
| L8 | Boutons « Signaler » : le nom inclut le message concerné | 6.1 | P3 | « Signaler : Action requise… » |
| L9 | Le compteur « N message(s) traité(s) » est annoncé après chaque décision | 7.5 | P3 | Annonce vocale polie |
| L10 | Boutons de choix du scénario : l'état « enfoncé » est annoncé pour le choix fait | 7.1 | P4 | « bouton bascule, enfoncé » |
| L11 | Les graphiques ne sont pas lus (masqués) et les tableaux de données le sont, avec en-têtes | 1.3, 5.6, 5.7 | P7 | Tableau annoncé avec sa légende |
| L12 | Tableau « Ma progression » : les en-têtes de lignes et de colonnes sont annoncés | 5.7 | P6 | « Pré-test, 60 % » |
| L13 | Statuts (« Validé », « En cours ») lus en texte | 3.1 | P2, P6 | Aucun statut transmis par la couleur seule |
| L14 | Les liens externes (« Pour aller plus loin ») sont signalés | 6.1 | P3 | « (site externe) » |
| L15 | Les messages de confirmation (préférences, effacement) sont annoncés | 7.5 | P6, P9 | Lecture automatique |

## 4. Affichage et adaptation

| # | Vérification | RGAA | Pages | Attendu |
| --- | --- | --- | --- | --- |
| A1 | Zoom du navigateur à 200 % : aucun contenu coupé ni superposé | 10.4 | Toutes | Lecture confortable |
| A2 | Largeur 320 px (zoom 400 % ou mobile) : pas de défilement horizontal de la page | 10.11 | Toutes | Seuls les tableaux défilent |
| A3 | Espacement augmenté (préférence) : aucun texte tronqué | 10.12 | P3, P7 | Aucune perte |
| A4 | Désactiver les CSS (Firefox : Affichage → Style de page → Aucun style) : l'ordre de lecture reste compréhensible | 10.3 | P1, P3 | Contenu dans un ordre logique |
| A5 | Mode contraste élevé Windows (couleurs forcées) : textes, boutons, focus et barres de graphiques visibles | – | P3, P7 | Tout reste perceptible |
| A6 | Thèmes sombre et contraste renforcé : pas de texte illisible | 3.2 | P1, P3, P7 | Lisibilité maintenue |
| A7 | Orientation portrait et paysage sur mobile | 13.9 | P3 | Pas de blocage |

## 5. Contenus et compréhension

| # | Vérification | RGAA | Pages | Attendu |
| --- | --- | --- | --- | --- |
| E1 | Langue de la page déclarée (`lang="fr"`) ; les passages en anglais (« phishing ») restent compréhensibles | 8.3, 8.7 | P3 | Prononciation acceptable |
| E2 | Liens explicites hors contexte | 6.1 | Toutes | Pas de « cliquez ici » |
| E3 | Version FALC : phrases courtes, une idée par phrase, vocabulaire simple (relecture par une personne concernée si possible) | – | P5 | Compréhensible |
| E4 | Audio : la transcription contient **toute** l'information (locuteurs compris) | 4.1 | P4 | Équivalent complet |
| E5 | Sous-titres synchronisés avec la voix | 4.3 | P4 | Décalage non gênant |
| E6 | Aucune limite de temps, aucune animation qui clignote | 13.1, 13.7 | Toutes | Conforme |

## 6. Consigner un défaut

Pour chaque défaut, notez :

| Champ | Exemple |
| --- | --- |
| Identifiant | D-01 |
| Page et vérification | P3 – L9 |
| Environnement | NVDA 2026.x + Firefox 14x |
| Constat | Le compteur n'est pas annoncé après la décision |
| Critère RGAA | 7.5 |
| Gravité | Bloquant / Gênant / Mineur |
| Correction proposée | … |
| Statut | À corriger / Corrigé le … |

## 7. Synthèse

| Section | Vérifications | Conformes | Non conformes | Non applicables |
| --- | --- | --- | --- | --- |
| Clavier (C1–C12) | 12 | | | |
| Lecteur d'écran (L1–L15) | 15 | | | |
| Affichage (A1–A7) | 7 | | | |
| Contenus (E1–E6) | 6 | | | |
| **Total** | **40** | | | |

**Conclusion** (à reporter dans la déclaration) :
- **totalement conforme** : aucun défaut ;
- **partiellement conforme** : quelques défauts non bloquants, listés dans « Contenus non accessibles » avec une alternative ;
- **non conforme** : défauts bloquants.

> Remarque : cette grille est un **audit de premier niveau**. Un audit RGAA complet porte sur les 106 critères et sur l'ensemble de l'échantillon ; il est idéalement réalisé ou validé par un auditeur qualifié et, pour le FALC, par des personnes concernées.
