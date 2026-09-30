# Adapter la plateforme à une organisation

Ce guide décrit, étape par étape, comment passer de l'« Organisation exemple » à une organisation réelle. **Aucune modification du code n'est nécessaire.**

Conseil : travaillez sur une copie, `cp config/organisation.json config/mon-organisation.json`, et utilisez-la avec la variable `ORGANISATION_CONFIG` :

```bash
ORGANISATION_CONFIG=config/mon-organisation.json npm run check   # validation + aperçu des parcours
ORGANISATION_CONFIG=config/mon-organisation.json npm run dev     # aperçu du site
```

Dans VS Code, le schéma `organisation.schema.json` propose l'autocomplétion et signale les erreurs pendant la saisie.

---

## 1. Identité de l'organisation

```json
"organisation": {
  "nom": "Nom complet de l'organisation",
  "nomCourt": "Nom court",
  "logo": "organisation/mon-logo.svg",
  "logoAlt": "Nom de l'organisation",
  "secteur": "sante",
  "taille": "eti",
  "effectif": 650,
  "typeSI": "hybride"
}
```

- **Logo** : déposez le fichier dans `public/organisation/` (SVG, PNG ou WebP). Les URL externes sont refusées. `logoAlt` est obligatoire dès qu'un logo est fourni.
- **secteur** : `generique`, `sante`, `industrie`, `finance`, `collectivite`, `education`, `commerce`.
- **taille** : `tpe`, `pme`, `eti`, `ge`.
- **effectif** : sert à dimensionner la population fictive du tableau de bord et les effectifs estimés du plan.
- **typeSI** : `cloud`, `sur-site`, `hybride`.

## 2. Contacts

```json
"contacts": {
  "securite": "rssi@mon-organisation.fr",
  "signalement": "le bouton « Signaler » de la messagerie ou le 4444",
  "telephoneUrgence": "01 23 45 67 89",
  "accessibilite": "accessibilite@mon-organisation.fr"
}
```

Ces valeurs sont **injectées automatiquement dans tous les modules** grâce aux variables `{{contacts.securite}}`, `{{contacts.signalement}}`, etc. Le domaine de l'adresse `securite` (ex. `mon-organisation.fr`) sert aussi à rendre les simulations d'hameçonnage réalistes : les faux expéditeurs imitent le vrai domaine.

## 3. Couleurs

```json
"charte": {
  "couleurPrimaire": "#4FB3A9",
  "couleurSecondaire": "#F2A541",
  "correctionContrasteAuto": true
}
```

Le contraste de chaque couleur est vérifié automatiquement (≥ 4,5:1, critère WCAG 1.4.3) :

- `true` : une couleur trop claire est **assombrie** juste assez pour être conforme, et un avertissement indique la valeur retenue ;
- `false` : le build **échoue** et indique la couleur à corriger.

Exemple réel avec `config/exemples/clinique.json` :

```
⚠ charte.couleurPrimaire (#4FB3A9) : contraste 2.28:1 insuffisant … Couleur corrigée automatiquement en #367A73.
```

## 4. Profils et analyse de risques

### Profils actifs

```json
"profilsActifs": ["utilisateur", "manager", "admin-it", "nouvel-arrivant", "nomade"]
```

Retirez un profil sans objet (par exemple `nomade` s'il n'y a pas de télétravail). Pour **créer un profil**, ajoutez un fichier `contenus/profils/<id>.json`, sur le modèle des fichiers existants : besoins, objectifs reliés aux modules, risques d'exposition, part de l'effectif.

### Risques prioritaires : le lien avec l'analyse de risques

```json
"risquesPrioritaires": [
  { "id": "rancongiciel", "priorite": 3, "justification": "Scénario stratégique n° 1 de l'analyse EBIOS RM." },
  { "id": "fuite-donnees", "priorite": 3, "justification": "Données de santé." },
  { "id": "ia-generative", "priorite": 2 }
]
```

- `priorite` : 1 (faible), 2 (moyenne), 3 (haute).
- `justification` (facultative mais recommandée) : elle apparaît dans le plan exporté et **relie le programme à votre analyse de risques**.
- Identifiants disponibles : voir `contenus/risques.json` (`hameconnage`, `quishing`, `ingenierie-sociale`, `fraude-president`, `deepfake`, `ia-generative`, `fuite-donnees`, `mots-de-passe`, `rancongiciel`, `nomadisme`, `privileges-admin`, `shadow-it`). Un nouveau risque s'ajoute dans ce fichier.

**Effet** : l'ordre des parcours est recalculé automatiquement. `npm run check` affiche le résultat :

```
• Utilisateur standard [69 min] : M1*(6) → M2*(10) → M7*(12) → M4(5) → M5(3) → M6(3) → M3(0)
```

Le nombre entre parenthèses est le score de priorité : la somme des priorités des risques couverts par le module, doublées lorsque le profil y est particulièrement exposé. `*` signale un module obligatoire. Un module qui ne couvre aucun risque prioritaire passe en « complémentaire ».

## 5. Réglementations, fréquences et évaluation

```json
"reglementations": ["rgpd", "nis2", "hds"],
"modulesSectoriels": ["sante"],
"campagnes": {
  "debut": "2027-01-04",
  "onboardingDelaiJours": 7,
  "simulationPhishing": "mensuelle",
  "rappelModules": "trimestrielle",
  "veilleNouvellesMenaces": "semestrielle",
  "exerciceCrise": "annuelle"
},
"evaluation": { "seuilReussite": 80, "delaiRetardJours": 21 }
```

- **Fréquences** : `mensuelle`, `trimestrielle`, `semestrielle`, `annuelle`. Le calendrier annuel, l'export `.ics` et la section 9 du plan sont régénérés à partir de ces valeurs.
- **modulesSectoriels** : active les modules de `contenus/secteurs/<secteur>/modules/` (voir `contenus/secteurs/README.md`).
- **seuilReussite** : pourcentage de bonnes réponses au post-test pour valider un module.
- **delaiRetardJours** : au-delà de ce délai, un module non terminé apparaît « en retard » dans le tableau de bord.

Autres réglages :
- `accessibilite.dateAudit` et `accessibilite.etatConformite` alimentent la déclaration d'accessibilité ;
- `demo.graine` et `demo.dateReference` rendent le tableau de bord fictif reproductible.

## 6. Ajouter ou modifier un module

Chaque module est un dossier `contenus/modules/<id>/`. Le nom du dossier doit être identique à l'`id`.

| Fichier | Contenu | Obligatoire |
| --- | --- | --- |
| `module.json` | Titre, résumé, risques couverts, profils, profils pour lesquels il est obligatoire, durée, niveau, formats, objectifs, fréquence de renouvellement, sources | Oui |
| `standard.fr.md` | Contenu essentiel (Markdown ; titres à partir de `##`) | Oui |
| `falc.fr.md` | Version facile à lire et à comprendre | **Oui** (le build échoue sinon) |
| `quiz.json` | `pretest` (≥ 2 questions) et `posttest` (≥ 3 questions), avec `enonceFalc` facultatif | Oui |
| `scenario.json` | Mise en situation : `boite-mail` ou `embranchements` | Non |

Règles utiles :

- Les variables `{{organisation.nom}}`, `{{organisation.domaine}}`, `{{contacts.securite}}`, `{{contacts.signalement}}`, `{{contacts.telephoneUrgence}}`… sont remplacées automatiquement. Une variable inconnue fait échouer le build.
- Le HTML brut n'est pas interprété dans le Markdown (sécurité) : utilisez uniquement la syntaxe Markdown.
- Pour un média audio ou vidéo, ajoutez le fichier et ses sous-titres `.vtt` dans `public/medias/<module>/`, puis la transcription (`transcription-….fr.md`) dans le dossier du module. Les trois sont obligatoires.
- Dans `scenario.json` (embranchements), chaque étape doit être atteignable depuis `depart` ; une étape sans `choix` est une fin.

Validez ensuite avec `npm run check`, qui signale précisément le fichier et le champ en cause.

## 7. Pages éditoriales

Les textes de l'accueil, de la déclaration d'accessibilité et de la page de confidentialité se trouvent dans `contenus/pages/*.fr.md`. Relisez la déclaration d'accessibilité après chaque audit.

## 8. Régénérer les livrables

```bash
export ORGANISATION_CONFIG=config/mon-organisation.json
npm run check          # validation
npm run build          # site
npm run test:e2e       # accessibilité et sécurité avec les nouvelles couleurs et contenus
npm run plan           # exports/plan-sensibilisation-<organisation>.md et .pdf
npm run captures       # captures d'écran à jour
```

Pour le déploiement, définissez la même variable `ORGANISATION_CONFIG` dans les paramètres de Cloudflare Pages, ou remplacez directement `config/organisation.json`.

## 9. Traduire un contenu

Le français est la langue de référence. Pour publier une autre langue, ajoutez-la à la configuration : `"langues": { "defaut": "fr", "disponibles": ["fr", "en"] }`. Les pages sont alors générées sous `/en/`.

| Contenu | Comment le traduire |
| --- | --- |
| Interface | `src/i18n/en.json` (mêmes clés que `fr.json` ; un test vérifie qu'aucune ne manque) |
| Textes courts des JSON (risques, profils, titres de modules, justifications de la config) | Remplacer `"texte"` par `{ "fr": "texte", "en": "text" }` |
| Contenu d'un module | Ajouter `standard.en.md` et `falc.en.md` dans le dossier du module |
| Quiz et mise en situation | Copier `quiz.json` en `quiz.en.json` (et `scenario.json` en `scenario.en.json`), puis traduire **uniquement les textes** |
| Transcriptions | `transcription-….en.md` à côté de la version française |
| Pages éditoriales | `contenus/pages/<page>.en.md` |

Le build vérifie qu'une traduction a exactement la même structure que l'original (mêmes identifiants, mêmes bonnes réponses, mêmes enchaînements). Un contenu non traduit reste disponible en français, avec un avis et l'attribut `lang="fr"`.

## Liste de contrôle

- [ ] Identité, logo et texte alternatif
- [ ] Contacts réels (sécurité, signalement, urgence, accessibilité)
- [ ] Couleurs de la charte (vérifier les avertissements de contraste)
- [ ] Profils actifs pertinents
- [ ] Risques prioritaires repris de l'analyse de risques, avec justification
- [ ] Réglementations applicables
- [ ] Fréquences des campagnes et date de début
- [ ] Seuil de réussite et délai de retard
- [ ] Relecture des modules (procédures internes, outils autorisés)
- [ ] Déclaration d'accessibilité et date d'audit
- [ ] `npm run test:tout` au vert, puis `npm run plan`
