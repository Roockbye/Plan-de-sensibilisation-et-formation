/**
 * Schéma et chargement du fichier de configuration de l'organisation.
 * Tout ce qui est propre à une organisation est décrit ici, rien n'est codé en dur ailleurs.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { identifiantSchema, LANGUES, texteSchema } from './texte.ts';
import { ajusterContraste, ratioContraste, RATIO_AA_TEXTE } from './contraste.ts';

export const FREQUENCES = ['mensuelle', 'trimestrielle', 'semestrielle', 'annuelle'] as const;
export const SECTEURS = ['generique', 'sante', 'industrie', 'finance', 'collectivite', 'education', 'commerce'] as const;
export const REGLEMENTATIONS = ['rgpd', 'nis2', 'iso27001', 'dora', 'hds', 'pgssi-s', 'lpm', 'rgs', 'pci-dss'] as const;

const couleurSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'couleur au format #RRGGBB attendue');
const courrielSchema = z.email('adresse e-mail invalide');

export const configSchema = z.strictObject({
  $schema: z.string().optional(),
  organisation: z.strictObject({
    nom: z.string().trim().min(2).max(80),
    nomCourt: z.string().trim().min(2).max(20).optional(),
    /** Chemin d'un fichier placé dans public/organisation/ (aucune URL externe). */
    logo: z
      .string()
      .regex(/^organisation\/[a-z0-9._-]+\.(svg|png|webp)$/, 'le logo doit être un fichier de public/organisation/ (svg, png ou webp)')
      .optional(),
    logoAlt: z.string().trim().min(2).optional(),
    secteur: z.enum(SECTEURS),
    taille: z.enum(['tpe', 'pme', 'eti', 'ge']),
    effectif: z.number().int().min(1).max(500000),
    typeSI: z.enum(['cloud', 'sur-site', 'hybride']),
  }),
  contacts: z.strictObject({
    securite: courrielSchema,
    /** Comment signaler un incident ou un message suspect (texte affiché dans les modules). */
    signalement: texteSchema,
    telephoneUrgence: z.string().trim().regex(/^[0-9 +().-]{4,20}$/, 'numéro de téléphone invalide'),
    accessibilite: courrielSchema,
  }),
  charte: z.strictObject({
    couleurPrimaire: couleurSchema,
    couleurSecondaire: couleurSchema,
    /** true : les couleurs trop peu contrastées sont corrigées (avec avertissement) ; false : le build échoue. */
    correctionContrasteAuto: z.boolean().default(true),
  }),
  langues: z
    .strictObject({
      defaut: z.enum(LANGUES).default('fr'),
      disponibles: z.array(z.enum(LANGUES)).min(1).default(['fr']),
    })
    .default({ defaut: 'fr', disponibles: ['fr'] }),
  profilsActifs: z.array(identifiantSchema).min(1),
  risquesPrioritaires: z
    .array(
      z.strictObject({
        id: identifiantSchema,
        priorite: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        /** Lien avec l'analyse de risques de l'organisation (scénario EBIOS RM, incident passé…). */
        justification: texteSchema.optional(),
      }),
    )
    .min(1),
  reglementations: z.array(z.enum(REGLEMENTATIONS)).default([]),
  modulesSectoriels: z.array(z.enum(SECTEURS).exclude(['generique'])).default([]),
  campagnes: z.strictObject({
    debut: z.iso.date('date AAAA-MM-JJ attendue'),
    onboardingDelaiJours: z.number().int().min(1).max(90),
    simulationPhishing: z.enum(FREQUENCES),
    rappelModules: z.enum(FREQUENCES),
    veilleNouvellesMenaces: z.enum(FREQUENCES),
    exerciceCrise: z.enum(FREQUENCES).default('annuelle'),
  }),
  evaluation: z.strictObject({
    /** Score minimal (en %) au post-test pour valider un module. */
    seuilReussite: z.number().int().min(50).max(100),
    /** Nombre de jours après lesquels un module non terminé est « en retard ». */
    delaiRetardJours: z.number().int().min(1).max(365),
  }),
  accessibilite: z
    .strictObject({
      /** Date du dernier audit, affichée dans la déclaration d'accessibilité. */
      dateAudit: z.iso.date().optional(),
      /** État de conformité RGAA déclaré (à mettre à jour après un audit complet). */
      etatConformite: z.enum(['totalement conforme', 'partiellement conforme', 'non conforme']).default('partiellement conforme'),
    })
    .default({ etatConformite: 'partiellement conforme' }),
  demo: z
    .strictObject({
      /** Graine du générateur de la population fictive (tableau de bord reproductible). */
      graine: z.number().int().min(1).default(2027),
      /** Date de référence du tableau de bord fictif (sinon : date du build). */
      dateReference: z.iso.date().optional(),
    })
    .default({ graine: 2027 }),
});

export type ConfigBrute = z.input<typeof configSchema>;
export type Config = z.infer<typeof configSchema>;

export interface Theme {
  clair: { fond: string; surface: string; texte: string; primaire: string; secondaire: string; surPrimaire: string };
  sombre: { fond: string; surface: string; texte: string; primaire: string; secondaire: string; surPrimaire: string };
}

export interface ConfigValidee {
  config: Config;
  theme: Theme;
  avertissements: string[];
}

export class ErreurConfig extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErreurConfig';
  }
}

const NEUTRES = {
  clair: { fond: '#FFFFFF', surface: '#F3F4F6', texte: '#1A1C1E' },
  sombre: { fond: '#15171A', surface: '#212429', texte: '#F1F3F5' },
};

/** Calcule les couleurs réellement utilisées et vérifie qu'elles respectent le ratio AA. */
export function construireTheme(config: Config): { theme: Theme; avertissements: string[] } {
  const avertissements: string[] = [];
  const auto = config.charte.correctionContrasteAuto;

  const verifier = (nom: string, couleur: string, fonds: string[], contexte: string): string => {
    const ajustee = ajusterContraste(couleur, fonds, RATIO_AA_TEXTE);
    if (ajustee === null) {
      throw new ErreurConfig(`charte.${nom} (${couleur}) : aucune variante n'atteint ${RATIO_AA_TEXTE}:1 ${contexte}.`);
    }
    if (ajustee !== couleur.toUpperCase()) {
      const ratio = Math.min(...fonds.map((f) => ratioContraste(couleur, f))).toFixed(2);
      const msg = `charte.${nom} (${couleur}) : contraste ${ratio}:1 insuffisant ${contexte} (minimum ${RATIO_AA_TEXTE}:1).`;
      if (!auto) throw new ErreurConfig(`${msg} Corrigez la couleur ou activez charte.correctionContrasteAuto.`);
      avertissements.push(`${msg} Couleur corrigée automatiquement en ${ajustee}.`);
    }
    return ajustee;
  };

  const { couleurPrimaire, couleurSecondaire } = config.charte;
  const fondsClairs = [NEUTRES.clair.fond, NEUTRES.clair.surface];
  const fondsSombres = [NEUTRES.sombre.fond, NEUTRES.sombre.surface];

  const theme: Theme = {
    clair: {
      ...NEUTRES.clair,
      // Utilisée comme texte sur fond clair ET comme fond de bouton sous un texte blanc.
      primaire: verifier('couleurPrimaire', couleurPrimaire, fondsClairs, 'sur fond clair (thème clair)'),
      secondaire: verifier('couleurSecondaire', couleurSecondaire, fondsClairs, 'sur fond clair (thème clair)'),
      surPrimaire: NEUTRES.clair.fond,
    },
    sombre: {
      ...NEUTRES.sombre,
      primaire: ajusterContraste(couleurPrimaire, fondsSombres) ?? NEUTRES.sombre.texte,
      secondaire: ajusterContraste(couleurSecondaire, fondsSombres) ?? NEUTRES.sombre.texte,
      surPrimaire: NEUTRES.sombre.fond,
    },
  };
  return { theme, avertissements };
}

function formaterErreurZod(erreur: z.ZodError): string {
  return erreur.issues
    .map((i) => `  • ${i.path.length ? i.path.join('.') : '(racine)'} : ${i.message}`)
    .join('\n');
}

/** Valide un objet de configuration (sans accès disque). */
export function validerConfig(brute: unknown): ConfigValidee {
  const resultat = configSchema.safeParse(brute);
  if (!resultat.success) {
    throw new ErreurConfig(`Configuration invalide :\n${formaterErreurZod(resultat.error)}`);
  }
  const config = resultat.data;
  const avertissements: string[] = [];

  const doublons = (liste: string[]) => liste.filter((v, i) => liste.indexOf(v) !== i);
  const risquesEnDouble = doublons(config.risquesPrioritaires.map((r) => r.id));
  if (risquesEnDouble.length) throw new ErreurConfig(`risquesPrioritaires : risque(s) en double : ${risquesEnDouble.join(', ')}`);
  const profilsEnDouble = doublons(config.profilsActifs);
  if (profilsEnDouble.length) throw new ErreurConfig(`profilsActifs : profil(s) en double : ${profilsEnDouble.join(', ')}`);
  if (!config.langues.disponibles.includes(config.langues.defaut)) {
    throw new ErreurConfig('langues.defaut doit figurer dans langues.disponibles');
  }
  if (config.organisation.logo && !config.organisation.logoAlt) {
    throw new ErreurConfig('organisation.logoAlt est obligatoire quand un logo est fourni (alternative textuelle, RGAA 1.1)');
  }

  const { theme, avertissements: avContraste } = construireTheme(config);
  avertissements.push(...avContraste);
  return { config, theme, avertissements };
}

export const CHEMIN_CONFIG_PAR_DEFAUT = 'config/organisation.json';

/** Chemin de la configuration active : variable ORGANISATION_CONFIG, sinon config/organisation.json. */
export function cheminConfig(): string {
  return resolve(process.cwd(), process.env.ORGANISATION_CONFIG || CHEMIN_CONFIG_PAR_DEFAUT);
}

export function chargerConfig(chemin = cheminConfig()): ConfigValidee {
  if (!existsSync(chemin)) throw new ErreurConfig(`Fichier de configuration introuvable : ${chemin}`);
  let brute: unknown;
  try {
    brute = JSON.parse(readFileSync(chemin, 'utf8'));
  } catch (e) {
    throw new ErreurConfig(`${chemin} n'est pas un JSON valide : ${(e as Error).message}`);
  }
  const resultat = validerConfig(brute);
  if (resultat.config.organisation.logo) {
    const logo = resolve(process.cwd(), 'public', resultat.config.organisation.logo);
    if (!existsSync(logo)) throw new ErreurConfig(`organisation.logo : fichier introuvable (${logo})`);
  }
  return resultat;
}
