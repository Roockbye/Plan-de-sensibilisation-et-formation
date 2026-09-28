# Modules sectoriels (optionnels)

Chaque secteur peut apporter ses propres modules, activés dans la configuration :

```json
"modulesSectoriels": ["sante"]
```

Structure attendue (identique aux modules génériques) :

```
contenus/secteurs/<secteur>/modules/<id-module>/
├── module.json      (avec "secteur": "<secteur>" et un code distinct, ex. « S1 »)
├── standard.fr.md
├── falc.fr.md
├── quiz.json
└── scenario.json    (facultatif)
```

Secteurs reconnus : `sante`, `industrie`, `finance`, `collectivite`, `education`, `commerce`.

Idées de modules par secteur :

| Secteur | Exemples de modules |
| --- | --- |
| Santé | Secret médical et accès au dossier patient, dispositifs médicaux connectés, messagerie sécurisée de santé |
| Industrie | Sécurité des systèmes industriels (OT), clés USB et maintenance, accès des prestataires |
| Finance | Fraude aux moyens de paiement, DORA, conformité des échanges avec les clients |
| Collectivité | Données des administrés, élus et fraude au président, continuité du service public |
