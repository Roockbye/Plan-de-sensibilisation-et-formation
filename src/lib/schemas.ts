/**
 * Schémas des contenus pédagogiques (dossier contenus/).
 * Un contenu invalide fait échouer `npm run check` et le build, avec un message explicite.
 */
import { z } from 'zod';
import { FREQUENCES, REGLEMENTATIONS, SECTEURS } from './config.ts';
import { identifiantSchema, texteSchema } from './texte.ts';

export const FORMATS = [
  'micro-module',
  'quiz',
  'mise-en-situation',
  'simulation-hameconnage',
  'audio',
  'video',
  'fiche-reflexe',
] as const;
export type Format = (typeof FORMATS)[number];

export const NIVEAUX_BLOOM = ['connaitre', 'comprendre', 'appliquer', 'analyser', 'evaluer'] as const;

// --- Risques -------------------------------------------------------------

export const risqueSchema = z.strictObject({
  id: identifiantSchema,
  libelle: texteSchema,
  description: texteSchema,
  categorie: z.enum(['humain', 'technique', 'organisationnel']),
  /** Menace liée aux nouvelles technologies (IA générative, deepfake, QR code…). */
  emergent: z.boolean().default(false),
  exemples: z.array(texteSchema).default([]),
});
export const catalogueRisquesSchema = z.array(risqueSchema).min(1);
export type Risque = z.infer<typeof risqueSchema>;

// --- Profils -------------------------------------------------------------

export const profilSchema = z.strictObject({
  id: identifiantSchema,
  libelle: texteSchema,
  description: texteSchema,
  besoins: z.array(texteSchema).min(1),
  objectifs: z
    .array(
      z.strictObject({
        id: identifiantSchema,
        texte: texteSchema,
        niveau: z.enum(NIVEAUX_BLOOM),
        /** Modules qui travaillent et évaluent cet objectif (traçabilité objectif → moyen → évaluation). */
        modules: z.array(identifiantSchema).min(1),
      }),
    )
    .min(1),
  /** Risques auxquels ce profil est particulièrement exposé : leur poids est doublé dans son parcours. */
  exposition: z.array(identifiantSchema).default([]),
  contraintes: z.array(texteSchema).default([]),
  dureeAnnuelleCibleMinutes: z.number().int().min(10).max(600),
  /** Part de l'effectif par défaut (population fictive du tableau de bord). */
  partEffectif: z.number().min(0).max(1),
  ordre: z.number().int().default(100),
});
export type Profil = z.infer<typeof profilSchema>;

// --- Modules -------------------------------------------------------------

const mediaSchema = z.strictObject({
  id: identifiantSchema,
  type: z.enum(['audio', 'video']),
  titre: texteSchema,
  /** Chemin dans public/ (ex. « medias/fraude-president/appel.mp3 »). */
  fichier: z.string().regex(/^medias\/[a-z0-9/_.-]+\.(mp3|ogg|m4a|mp4|webm)$/),
  /** Sous-titres WebVTT dans public/. */
  sousTitres: z.string().regex(/^medias\/[a-z0-9/_.-]+\.vtt$/),
  /** Transcription textuelle complète (fichier Markdown du dossier du module). */
  transcription: z.string().regex(/^[a-z0-9_-]+\.fr\.md$/),
  dureeSecondes: z.number().int().min(1),
  /** Mention obligatoire pour un contenu synthétique (voix générée, deepfake pédagogique). */
  mentionSynthetique: texteSchema.optional(),
});

export const moduleSchema = z.strictObject({
  id: identifiantSchema,
  code: z.string().regex(/^[A-Z]{1,3}[0-9]{1,2}$/, 'code court attendu (ex. « M1 », « S2 »)'),
  titre: texteSchema,
  resume: texteSchema,
  risques: z.array(identifiantSchema).min(1),
  profils: z.array(identifiantSchema).min(1),
  obligatoirePour: z.array(identifiantSchema).default([]),
  dureeMinutes: z.number().int().min(2).max(120),
  niveau: z.enum(['decouverte', 'intermediaire', 'avance']),
  formats: z.array(z.enum(FORMATS)).min(1),
  objectifs: z.array(texteSchema).min(1),
  /** Cartes PARADE gagnées en validant le module : 1 à 3 réflexes courts (jeu « Attaque / Parade »). */
  parades: z.array(z.strictObject({ titre: texteSchema })).min(1).max(3),
  reglementations: z.array(z.enum(REGLEMENTATIONS)).default([]),
  /** Fréquence de renouvellement recommandée de ce module. */
  renouvellement: z.enum(FREQUENCES),
  version: z.string().regex(/^\d+\.\d+$/),
  derniereRevue: z.iso.date(),
  sources: z.array(z.strictObject({ titre: z.string(), url: z.url({ protocol: /^https$/ }) })).default([]),
  medias: z.array(mediaSchema).default([]),
  secteur: z.enum(SECTEURS).default('generique'),
  ordre: z.number().int().default(100),
});
export type ModuleMeta = z.infer<typeof moduleSchema>;

// --- Quiz ----------------------------------------------------------------

const questionSchema = z
  .strictObject({
    id: identifiantSchema,
    enonce: texteSchema,
    /** Formulation simplifiée (FALC) ; à défaut, l'énoncé standard est utilisé. */
    enonceFalc: texteSchema.optional(),
    type: z.enum(['unique', 'multiple']),
    choix: z.array(z.strictObject({ id: identifiantSchema, texte: texteSchema })).min(2).max(6),
    bonnes: z.array(identifiantSchema).min(1),
    explication: texteSchema,
  })
  .superRefine((q, ctx) => {
    const ids = q.choix.map((c) => c.id);
    for (const b of q.bonnes) {
      if (!ids.includes(b)) ctx.addIssue({ code: 'custom', message: `bonne réponse « ${b} » absente des choix`, path: ['bonnes'] });
    }
    if (q.type === 'unique' && q.bonnes.length !== 1) {
      ctx.addIssue({ code: 'custom', message: 'une question « unique » doit avoir exactement une bonne réponse', path: ['bonnes'] });
    }
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'identifiants de choix en double', path: ['choix'] });
  });
export type Question = z.infer<typeof questionSchema>;

export const quizSchema = z.strictObject({
  /** Pré-test : mesure le niveau initial (non bloquant). */
  pretest: z.array(questionSchema).min(2),
  /** Post-test : mesure l'acquisition ; il valide le module au-delà du seuil de réussite. */
  posttest: z.array(questionSchema).min(3),
});
export type Quiz = z.infer<typeof quizSchema>;

// --- Mises en situation --------------------------------------------------

const lienSchema = z.strictObject({
  texteAffiche: z.string().min(1),
  /** Adresse réelle (fictive) vers laquelle pointerait le lien : jamais rendue cliquable. */
  destination: z.string().min(1),
});

const messageSchema = z.strictObject({
  id: identifiantSchema,
  canal: z.enum(['email', 'sms', 'affiche-qr', 'messagerie']),
  expediteur: z.strictObject({ nom: z.string().min(1), adresse: z.string().min(1) }),
  objet: z.string().min(1).optional(),
  date: z.string().min(1),
  corps: texteSchema,
  liens: z.array(lienSchema).default([]),
  pieceJointe: z.string().optional(),
  qrCode: z.strictObject({ description: texteSchema, destination: z.string().min(1) }).optional(),
  nature: z.enum(['legitime', 'malveillant']),
  indices: z.array(texteSchema).default([]),
  explication: texteSchema,
});

export const scenarioBoiteMailSchema = z.strictObject({
  type: z.literal('boite-mail'),
  titre: texteSchema,
  consigne: texteSchema,
  messages: z.array(messageSchema).min(2),
});

const etapeSchema = z.strictObject({
  id: identifiantSchema,
  titre: texteSchema,
  texte: texteSchema,
  /** Identifiant d'un média du module (audio/vidéo) présenté à cette étape. */
  media: identifiantSchema.optional(),
  choix: z
    .array(
      z.strictObject({
        id: identifiantSchema,
        texte: texteSchema,
        /** Étape suivante ; absente = fin du scénario. */
        suivant: identifiantSchema.optional(),
        adapte: z.boolean(),
        retour: texteSchema,
      }),
    )
    .default([]),
});

export const scenarioEmbranchementsSchema = z
  .strictObject({
    type: z.literal('embranchements'),
    titre: texteSchema,
    consigne: texteSchema,
    depart: identifiantSchema,
    etapes: z.array(etapeSchema).min(2),
  })
  .superRefine((s, ctx) => {
    const ids = new Set(s.etapes.map((e) => e.id));
    if (!ids.has(s.depart)) ctx.addIssue({ code: 'custom', message: `étape de départ « ${s.depart} » introuvable`, path: ['depart'] });
    for (const e of s.etapes) {
      for (const c of e.choix) {
        if (c.suivant && !ids.has(c.suivant)) {
          ctx.addIssue({ code: 'custom', message: `étape « ${c.suivant} » introuvable (choix ${e.id}/${c.id})`, path: ['etapes'] });
        }
      }
    }
    // Toutes les étapes doivent être atteignables depuis le départ.
    const vues = new Set<string>();
    const aVisiter = [s.depart];
    while (aVisiter.length) {
      const id = aVisiter.pop()!;
      if (vues.has(id)) continue;
      vues.add(id);
      s.etapes.find((e) => e.id === id)?.choix.forEach((c) => c.suivant && aVisiter.push(c.suivant));
    }
    const orphelines = [...ids].filter((id) => !vues.has(id));
    if (orphelines.length) ctx.addIssue({ code: 'custom', message: `étapes jamais atteintes : ${orphelines.join(', ')}`, path: ['etapes'] });
  });

export const scenarioSchema = z.union([scenarioBoiteMailSchema, scenarioEmbranchementsSchema]);
export type Scenario = z.infer<typeof scenarioSchema>;
export type ScenarioBoiteMail = z.infer<typeof scenarioBoiteMailSchema>;
export type ScenarioEmbranchements = z.infer<typeof scenarioEmbranchementsSchema>;
