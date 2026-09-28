/**
 * Génère le document « Plan de sensibilisation et de formation des utilisateurs à la sécurité du SI »
 * au format Markdown, entièrement à partir de la configuration et des contenus.
 * Changer d'organisation = changer la configuration, puis régénérer ce plan.
 */
import type { Plateforme } from './contenus.ts';
import type { Parcours } from './parcours.ts';
import { LIBELLES_TYPE, type Action } from './calendrier.ts';
import { tr, type Texte } from './texte.ts';
import { FORMATS } from './schemas.ts';

const FREQ: Record<string, string> = { mensuelle: 'mensuelle', trimestrielle: 'trimestrielle', semestrielle: 'semestrielle', annuelle: 'annuelle' };
const PRIORITE = { 1: 'Faible', 2: 'Moyenne', 3: 'Haute' } as const;
const FORMAT_LIBELLE: Record<(typeof FORMATS)[number], string> = {
  'micro-module': 'Module court (10 min environ)',
  quiz: 'Quiz (pré-test et post-test)',
  'mise-en-situation': 'Mise en situation à choix',
  'simulation-hameconnage': "Simulation d'hameçonnage pédagogique",
  audio: 'Contenu audio sous-titré et transcrit',
  video: 'Vidéo sous-titrée et transcrite',
  'fiche-reflexe': 'Fiche réflexe (« À retenir »)',
};
const SECTEUR: Record<string, string> = {
  generique: 'Tous secteurs', sante: 'Santé', industrie: 'Industrie', finance: 'Finance', collectivite: 'Collectivité', education: 'Éducation', commerce: 'Commerce',
};
const TYPE_SI: Record<string, string> = { cloud: 'Principalement cloud', 'sur-site': 'Sur site', hybride: 'Hybride (sur site et cloud)' };
const BLOOM: Record<string, string> = { connaitre: 'Connaître', comprendre: 'Comprendre', appliquer: 'Appliquer', analyser: 'Analyser', evaluer: 'Évaluer' };
const REGLEMENTATION: Record<string, string> = {
  rgpd: 'RGPD', nis2: 'Directive NIS2', iso27001: 'ISO/IEC 27001', dora: 'DORA', hds: 'Hébergement de données de santé (HDS)',
  'pgssi-s': 'PGSSI-S', lpm: 'Loi de programmation militaire (OIV)', rgs: 'RGS', 'pci-dss': 'PCI DSS',
};

/** Échappe une valeur placée dans une cellule de tableau Markdown. */
const cellule = (v: string) => v.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

function tableau(entetes: string[], lignes: string[][]): string {
  return [
    `| ${entetes.map(cellule).join(' | ')} |`,
    `| ${entetes.map(() => '---').join(' | ')} |`,
    ...lignes.map((l) => `| ${l.map(cellule).join(' | ')} |`),
  ].join('\n');
}

const dateFr = (iso: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

export function genererPlan(p: Plateforme, parcours: Parcours[], calendrier: Action[], dateGeneration: string): string {
  const L = p.config.langues.defaut;
  const t = (x: Texte) => tr(x, L);
  const { config } = p;
  const org = config.organisation;
  const risque = (id: string) => p.risques.find((r) => r.id === id);
  const libRisque = (id: string) => (risque(id) ? t(risque(id)!.libelle) : id);
  const libProfil = (id: string) => {
    const pr = p.profils.find((x) => x.id === id);
    return pr ? t(pr.libelle) : id;
  };
  const codeModule = (id: string) => p.modules.find((m) => m.meta.id === id)?.meta.code ?? id;
  const effectifs = new Map(parcours.map((pc) => [pc.profil.id, pc.profil.partEffectif]));
  const totalParts = [...effectifs.values()].reduce((s, v) => s + v, 0) || 1;
  const emergents = p.risques.filter((r) => r.emergent);
  const s: string[] = [];

  s.push(`# Plan de sensibilisation et de formation des utilisateurs à la sécurité du SI – ${org.nom}`);
  s.push(tableau(['Élément', 'Valeur'], [
    ['Organisation', org.nom],
    ['Secteur', SECTEUR[org.secteur]],
    ['Taille / effectif', `${org.taille.toUpperCase()} – ${org.effectif} personnes`],
    ['Système d\'information', TYPE_SI[org.typeSI]],
    ['Cadre réglementaire', config.reglementations.map((r) => REGLEMENTATION[r]).join(', ') || 'Non précisé'],
    ['Période couverte', `12 mois à partir du ${dateFr(config.campagnes.debut)}`],
    ['Document généré le', dateFr(dateGeneration)],
  ]));

  s.push('## 1. Finalité du plan');
  s.push(`Ce plan organise la sensibilisation et la formation de l'ensemble des utilisateurs de ${org.nom} à la sécurité du système d'information. Il vise à réduire les risques d'origine humaine identifiés par l'analyse de risques, à ancrer des réflexes durables (reconnaître, protéger, signaler) et à mesurer leur progression. Il est piloté par l'équipe sécurité (contact : ${config.contacts.securite}) et révisé chaque année.`);
  s.push(`Les principes retenus : des parcours différenciés par profil, des formats courts et variés, une accessibilité à toutes et tous (y compris les personnes en situation de handicap), une évaluation systématique avant et après chaque module, et une fréquence de renouvellement adaptée à l'évolution des menaces.`);

  s.push('## 2. Prise en compte de l\'analyse de risques');
  s.push('Les risques prioritaires ci-dessous sont issus de l\'analyse de risques de l\'organisation. Ils déterminent l\'ordre des parcours : plus un risque est prioritaire, plus les modules qui le traitent sont placés tôt.');
  s.push(tableau(['Risque', 'Priorité', 'Nouvelle menace', 'Justification', 'Modules'], config.risquesPrioritaires.map((r) => [
    libRisque(r.id),
    PRIORITE[r.priorite],
    risque(r.id)?.emergent ? 'Oui' : 'Non',
    r.justification ? t(r.justification) : '–',
    p.modules.filter((m) => m.meta.risques.includes(r.id)).map((m) => m.meta.code).join(', ') || 'Aucun (à couvrir)',
  ])));
  s.push('### Nouvelles technologies et menaces émergentes');
  s.push(`Le programme intègre explicitement les menaces liées aux nouvelles technologies : ${emergents.map((r) => `**${t(r.libelle)}**`).join(', ')}. Les modules correspondants sont renouvelés plus fréquemment (voir § 8) et leurs contenus sont revus selon une fréquence ${FREQ[config.campagnes.veilleNouvellesMenaces]}.`);

  s.push('## 3. Profils utilisateurs et besoins');
  for (const pc of parcours) {
    const pr = pc.profil;
    const n = Math.max(1, Math.round((org.effectif * pr.partEffectif) / totalParts));
    s.push(`### ${t(pr.libelle)} (environ ${n} personnes)`);
    s.push(t(pr.description));
    s.push('**Besoins identifiés :**\n\n' + pr.besoins.map((b) => `- ${t(b)}`).join('\n'));
    if (pr.contraintes.length) s.push('**Contraintes prises en compte :**\n\n' + pr.contraintes.map((c) => `- ${t(c)}`).join('\n'));
    s.push(`**Exposition particulière :** ${pr.exposition.map(libRisque).join(', ')}.`);
  }

  s.push('## 4. Objectifs pédagogiques par profil');
  s.push('Chaque objectif est formulé en termes observables (« être capable de… »), associé à un niveau de maîtrise (taxonomie de Bloom) et aux modules qui le travaillent et l\'évaluent.');
  for (const pc of parcours) {
    s.push(`### ${t(pc.profil.libelle)}`);
    s.push(tableau(['Objectif : à l\'issue du parcours, la personne est capable de…', 'Niveau', 'Modules'], pc.profil.objectifs.map((o) => [t(o.texte), BLOOM[o.niveau], o.modules.map(codeModule).join(', ')])));
  }

  s.push('## 5. Programme : modules et parcours');
  s.push(tableau(['Code', 'Module', 'Durée', 'Niveau', 'Risques couverts', 'Profils'], p.modules.map(({ meta }) => [
    meta.code, t(meta.titre), `${meta.dureeMinutes} min`, meta.niveau, meta.risques.map(libRisque).join(', '), meta.profils.filter((x) => config.profilsActifs.includes(x)).map(libProfil).join(', '),
  ])));
  s.push('### Parcours par profil');
  s.push('Ordre calculé automatiquement : socle obligatoire, puis modules prioritaires classés par score (Σ priorité du risque × 2 si le profil y est particulièrement exposé), puis modules complémentaires.');
  for (const pc of parcours) {
    const etapes = pc.etapes.map((e) => `${e.module.code}${e.categorie === 'obligatoire' ? ' (obligatoire)' : e.categorie === 'complementaire' ? ' (complémentaire)' : ''}`);
    s.push(`- **${t(pc.profil.libelle)}** – ${pc.dureeTotaleMinutes} min : ${etapes.join(' → ')}`);
  }

  s.push('## 6. Moyens pédagogiques');
  const formatsUtilises = FORMATS.filter((f) => p.modules.some((m) => m.meta.formats.includes(f)));
  s.push(tableau(['Moyen', 'Modules concernés'], formatsUtilises.map((f) => [FORMAT_LIBELLE[f], p.modules.filter((m) => m.meta.formats.includes(f)).map((m) => m.meta.code).join(', ')])));
  s.push('Chaque module suit la même séquence : **pré-test** (niveau initial), **contenu essentiel** court, **mise en situation** (simulation d\'hameçonnage dans la plateforme ou scénario à embranchements) et **post-test**. Les simulations d\'hameçonnage sont exclusivement pédagogiques : aucun message réel n\'est envoyé et les liens ne sont jamais actifs. Les séances collectives (exercice de crise pour la direction et les équipes informatiques) complètent le dispositif en ligne.');

  s.push('## 7. Accessibilité et inclusion');
  s.push([
    '- Plateforme conçue selon le RGAA 4.1 / WCAG 2.2 niveau AA et testée automatiquement (axe-core) à chaque modification.',
    '- Navigation complète au clavier, compatibilité avec les lecteurs d\'écran (NVDA, VoiceOver), focus visible.',
    '- **Version FALC** (facile à lire et à comprendre) de chaque module et de chaque question de quiz.',
    '- Préférences : taille du texte jusqu\'à 200 %, police pour la basse vision ou la dyslexie, espacement du texte, thème sombre, contraste renforcé, réduction des animations.',
    '- **Aucune limite de temps** dans les quiz et mises en situation ; possibilité de recommencer sans pénalité.',
    '- Médias : sous-titres et transcription intégrale ; aucune information portée uniquement par la couleur.',
    `- Couleurs de la charte de ${org.nom} vérifiées automatiquement (contraste ≥ 4,5:1) et corrigées si nécessaire.`,
    `- Contact accessibilité : ${config.contacts.accessibilite} ; alternatives (séance en présentiel, accompagnement individuel) proposées sur demande.`,
  ].join('\n'));

  s.push('## 8. Évaluation et indicateurs');
  s.push(tableau(['Niveau (modèle de Kirkpatrick)', 'Moyen d\'évaluation', 'Indicateur'], [
    ['1 – Réaction', 'Retours des apprenants, taux de participation', 'Taux de complétion par profil'],
    ['2 – Apprentissage', 'Pré-test et post-test de chaque module', `Écart pré/post ; taux de réussite (seuil : ${config.evaluation.seuilReussite} %)`],
    ['3 – Comportement', 'Simulations d\'hameçonnage successives, signalements réels', 'Taux de clic (↓) et taux de signalement (↑)'],
    ['4 – Résultats', 'Suivi des incidents d\'origine humaine', 'Nombre et gravité des incidents, délai de signalement'],
  ]));
  s.push(`Un module non terminé ${config.evaluation.delaiRetardJours} jours après son ouverture est considéré « en retard » et fait l'objet d'une relance. Les indicateurs sont suivis par profil dans le tableau de bord RSSI et présentés à la direction lors du bilan annuel. Les résultats individuels restent confidentiels : le pilotage s'appuie sur des indicateurs agrégés.`);

  s.push('## 9. Fréquence de renouvellement et calendrier');
  s.push(tableau(['Action', 'Fréquence'], [
    ['Parcours d\'accueil des nouveaux arrivants', `À chaque arrivée, sous ${config.campagnes.onboardingDelaiJours} jours`],
    ['Simulation d\'hameçonnage pédagogique', FREQ[config.campagnes.simulationPhishing]],
    ['Campagne de rappel et post-tests de consolidation', FREQ[config.campagnes.rappelModules]],
    ['Revue des contenus (nouvelles menaces)', FREQ[config.campagnes.veilleNouvellesMenaces]],
    ['Exercice de gestion de crise', FREQ[config.campagnes.exerciceCrise]],
    ['Bilan et révision du plan', 'annuelle'],
  ]));
  s.push(tableau(['Module', 'Renouvellement préconisé'], p.modules.map(({ meta }) => [`${meta.code} – ${t(meta.titre)}`, FREQ[meta.renouvellement]])));
  s.push('### Calendrier de l\'année');
  s.push(tableau(['Date', 'Type', 'Action', 'Public'], calendrier.map((a) => [dateFr(a.date), LIBELLES_TYPE[a.type], a.titre, a.profils.length ? a.profils.map(libProfil).join(', ') : 'Tous'])));

  s.push('## 10. Pilotage et amélioration continue');
  s.push([
    `- **Pilotage** : équipe sécurité (${config.contacts.securite}), avec l'appui des managers pour les relances et de la direction pour le portage.`,
    '- **Revue annuelle** : mise à jour de l\'analyse de risques, des profils, des contenus et des fréquences, à partir des indicateurs et des incidents de l\'année.',
    '- **Veille** : intégration des nouvelles menaces (publications de l\'ANSSI, de Cybermalveillance.gouv.fr, retours d\'incidents).',
    `- **Signalement** : ${config.contacts.signalement} ; urgence : ${config.contacts.telephoneUrgence}.`,
  ].join('\n'));

  return s.join('\n\n') + '\n';
}
