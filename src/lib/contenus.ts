/**
 * Chargement et validation de l'ensemble des contenus pédagogiques.
 * Tout est vérifié au build : schémas, références croisées, fichiers requis, variables.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { chargerConfig, ErreurConfig, type Config, type ConfigValidee } from './config.ts';
import {
  catalogueRisquesSchema,
  moduleSchema,
  profilSchema,
  quizSchema,
  scenarioSchema,
  type ModuleMeta,
  type Profil,
  type Quiz,
  type Risque,
  type Scenario,
} from './schemas.ts';
import { echapperJson, echapperMarkdown, remplacer, variables, variablesInconnues } from './personnalisation.ts';

export interface ModuleComplet {
  meta: ModuleMeta;
  dossier: string;
  /** Markdown personnalisé (variables remplacées). */
  standard: string;
  falc: string;
  quiz: Quiz;
  scenario?: Scenario;
  transcriptions: Record<string, string>;
}

export interface Contenus {
  racine: string;
  risques: Risque[];
  /** Profils actifs dans la configuration, dans l'ordre d'affichage. */
  profils: Profil[];
  /** Modules actifs : génériques + secteurs activés dans la configuration. */
  modules: ModuleComplet[];
  pages: Record<string, string>;
}

export interface Plateforme extends ConfigValidee, Contenus {}

const dossierContenus = () => resolve(process.cwd(), 'contenus');

function erreurs(chemin: string, e: z.ZodError): string {
  return `${chemin} :\n` + e.issues.map((i) => `  • ${i.path.join('.') || '(racine)'} : ${i.message}`).join('\n');
}

/** Lit un fichier, vérifie et remplace les variables de personnalisation. */
function lireTexte(chemin: string, vars: Record<string, string>, echapper: (v: string) => string): string {
  const brut = readFileSync(chemin, 'utf8');
  const inconnues = variablesInconnues(brut, vars);
  if (inconnues.length) {
    throw new ErreurConfig(`${chemin} : variable(s) inconnue(s) ${inconnues.map((v) => `{{${v}}}`).join(', ')}`);
  }
  return remplacer(brut, vars, echapper);
}

function lireJson<T>(chemin: string, schema: z.ZodType<T>, vars: Record<string, string>): T {
  let donnees: unknown;
  try {
    donnees = JSON.parse(lireTexte(chemin, vars, echapperJson));
  } catch (e) {
    if (e instanceof ErreurConfig) throw e;
    throw new ErreurConfig(`${chemin} : JSON invalide (${(e as Error).message})`);
  }
  const r = schema.safeParse(donnees);
  if (!r.success) throw new ErreurConfig(erreurs(chemin, r.error));
  return r.data;
}

const lireMarkdown = (chemin: string, vars: Record<string, string>) => lireTexte(chemin, vars, echapperMarkdown);

function exiger(chemin: string, raison: string) {
  if (!existsSync(chemin)) throw new ErreurConfig(`Fichier manquant : ${chemin} (${raison})`);
}

function chargerModule(dossier: string, vars: Record<string, string>): ModuleComplet {
  const meta = lireJson(join(dossier, 'module.json'), moduleSchema, vars);
  const nomDossier = dossier.split(/[\\/]/).pop();
  if (meta.id !== nomDossier) throw new ErreurConfig(`${dossier} : l'id « ${meta.id} » doit être identique au nom du dossier`);

  const standard = join(dossier, 'standard.fr.md');
  const falc = join(dossier, 'falc.fr.md');
  const quiz = join(dossier, 'quiz.json');
  exiger(standard, 'version standard du module');
  exiger(falc, 'version FALC obligatoire pour chaque module');
  exiger(quiz, 'pré-test et post-test obligatoires');

  const cheminScenario = join(dossier, 'scenario.json');
  const scenario = existsSync(cheminScenario) ? lireJson(cheminScenario, scenarioSchema, vars) : undefined;

  const transcriptions: Record<string, string> = {};
  for (const media of meta.medias) {
    exiger(resolve(process.cwd(), 'public', media.fichier), `média ${media.id}`);
    exiger(resolve(process.cwd(), 'public', media.sousTitres), `sous-titres obligatoires du média ${media.id}`);
    const t = join(dossier, media.transcription);
    exiger(t, `transcription obligatoire du média ${media.id}`);
    transcriptions[media.id] = lireMarkdown(t, vars);
  }
  if (scenario?.type === 'embranchements') {
    for (const etape of scenario.etapes) {
      if (etape.media && !meta.medias.some((m) => m.id === etape.media)) {
        throw new ErreurConfig(`${cheminScenario} : média « ${etape.media} » non déclaré dans module.json`);
      }
    }
  }

  return {
    meta,
    dossier,
    standard: lireMarkdown(standard, vars),
    falc: lireMarkdown(falc, vars),
    quiz: lireJson(quiz, quizSchema, vars),
    scenario,
    transcriptions,
  };
}

function sousDossiers(chemin: string): string[] {
  if (!existsSync(chemin)) return [];
  return readdirSync(chemin, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(chemin, d.name))
    .sort();
}

export function chargerContenus(config: Config, racine = dossierContenus()): Contenus {
  const vars = variables(config);

  // Risques
  const risques = lireJson(join(racine, 'risques.json'), catalogueRisquesSchema, vars);
  const idsRisques = new Set(risques.map((r) => r.id));
  for (const r of config.risquesPrioritaires) {
    if (!idsRisques.has(r.id)) {
      throw new ErreurConfig(`Configuration : risque prioritaire « ${r.id} » absent du catalogue (contenus/risques.json). Risques disponibles : ${[...idsRisques].join(', ')}`);
    }
  }

  // Profils
  const tousProfils = readdirSync(join(racine, 'profils'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => lireJson(join(racine, 'profils', f), profilSchema, vars));
  const idsProfils = new Set(tousProfils.map((p) => p.id));
  for (const id of config.profilsActifs) {
    if (!idsProfils.has(id)) {
      throw new ErreurConfig(`Configuration : profil actif « ${id} » introuvable dans contenus/profils/. Profils disponibles : ${[...idsProfils].join(', ')}`);
    }
  }
  const profils = tousProfils
    .filter((p) => config.profilsActifs.includes(p.id))
    .sort((a, b) => a.ordre - b.ordre);

  // Modules : génériques + secteurs activés
  const dossiers = [
    ...sousDossiers(join(racine, 'modules')),
    ...config.modulesSectoriels.flatMap((s) => sousDossiers(join(racine, 'secteurs', s, 'modules'))),
  ];
  const modules = dossiers.map((d) => chargerModule(d, vars)).sort((a, b) => a.meta.ordre - b.meta.ordre);

  const vus = new Map<string, string>();
  for (const m of modules) {
    const { id, code, risques: rs, profils: ps, obligatoirePour } = m.meta;
    if (vus.has(id)) throw new ErreurConfig(`Module « ${id} » défini deux fois`);
    if ([...vus.values()].includes(code)) throw new ErreurConfig(`Code module « ${code} » utilisé deux fois`);
    vus.set(id, code);
    for (const r of rs) if (!idsRisques.has(r)) throw new ErreurConfig(`Module ${id} : risque « ${r} » absent du catalogue`);
    for (const p of [...ps, ...obligatoirePour]) {
      if (!idsProfils.has(p)) throw new ErreurConfig(`Module ${id} : profil « ${p} » inconnu`);
    }
    for (const p of obligatoirePour) {
      if (!ps.includes(p)) throw new ErreurConfig(`Module ${id} : « ${p} » est dans obligatoirePour mais pas dans profils`);
    }
  }

  // Objectifs des profils → modules existants
  const idsModules = new Set(modules.map((m) => m.meta.id));
  for (const p of profils) {
    for (const r of p.exposition) if (!idsRisques.has(r)) throw new ErreurConfig(`Profil ${p.id} : risque exposé « ${r} » inconnu`);
    for (const o of p.objectifs) {
      for (const mod of o.modules) {
        if (!idsModules.has(mod)) throw new ErreurConfig(`Profil ${p.id}, objectif ${o.id} : module « ${mod} » introuvable ou inactif`);
      }
    }
  }

  // Pages éditoriales (déclaration d'accessibilité, confidentialité…)
  const pages: Record<string, string> = {};
  const dossierPages = join(racine, 'pages');
  if (existsSync(dossierPages)) {
    for (const f of readdirSync(dossierPages).filter((f) => f.endsWith('.fr.md'))) {
      pages[f.replace(/\.fr\.md$/, '')] = lireMarkdown(join(dossierPages, f), vars);
    }
  }

  return { racine, risques, profils, modules, pages };
}

let cache: Plateforme | undefined;

/** Point d'entrée unique : configuration + contenus validés (mis en cache pendant le build). */
export function plateforme(): Plateforme {
  if (!cache || process.env.NODE_ENV === 'development') {
    const cv = chargerConfig();
    cache = { ...cv, ...chargerContenus(cv.config) };
  }
  return cache;
}
