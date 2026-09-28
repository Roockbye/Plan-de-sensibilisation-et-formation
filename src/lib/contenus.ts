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
import { LANGUE_PAR_DEFAUT, type Langue } from './texte.ts';

/**
 * Contenu décliné par langue. Le français (langue de référence) est toujours présent ;
 * les autres langues sont facultatives (fichiers *.en.md, quiz.en.json…).
 */
export type ParLangue<T> = { fr: T } & Partial<Record<Langue, T>>;

/** Valeur dans la langue demandée, ou repli sur le français ; indique la langue réellement servie. */
export function enLangue<T>(v: ParLangue<T>, langue: Langue): { valeur: T; langue: Langue } {
  const trad = v[langue];
  return trad !== undefined ? { valeur: trad, langue } : { valeur: v.fr, langue: LANGUE_PAR_DEFAUT };
}

export interface ModuleComplet {
  meta: ModuleMeta;
  dossier: string;
  /** Markdown personnalisé (variables remplacées), par langue. */
  standard: ParLangue<string>;
  falc: ParLangue<string>;
  quiz: ParLangue<Quiz>;
  scenario?: ParLangue<Scenario>;
  transcriptions: Record<string, ParLangue<string>>;
}

export interface Contenus {
  racine: string;
  risques: Risque[];
  /** Profils actifs dans la configuration, dans l'ordre d'affichage. */
  profils: Profil[];
  /** Modules actifs : génériques + secteurs activés dans la configuration. */
  modules: ModuleComplet[];
  pages: Record<string, ParLangue<string>>;
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

/**
 * Une traduction doit avoir la même structure que l'original : mêmes identifiants,
 * mêmes bonnes réponses, mêmes enchaînements. Seuls les textes changent.
 */
const CLES_STRUCTURELLES = new Set(['id', 'type', 'bonnes', 'suivant', 'depart', 'nature', 'canal', 'media', 'adapte']);
function comparerStructure(ref: unknown, trad: unknown, chemin: string, cle = ''): void {
  if (Array.isArray(ref)) {
    if (!Array.isArray(trad) || trad.length !== ref.length) throw new ErreurConfig(`${chemin} : « ${cle} » n'a pas le même nombre d'éléments que l'original`);
    ref.forEach((v, i) => comparerStructure(v, trad[i], chemin, cle));
  } else if (ref && typeof ref === 'object') {
    if (!trad || typeof trad !== 'object') throw new ErreurConfig(`${chemin} : structure différente de l'original (${cle})`);
    const cles = new Set([...Object.keys(ref), ...Object.keys(trad)]);
    for (const k of cles) comparerStructure((ref as Record<string, unknown>)[k], (trad as Record<string, unknown>)[k], chemin, k);
  } else if (CLES_STRUCTURELLES.has(cle) && ref !== trad) {
    throw new ErreurConfig(`${chemin} : « ${cle} » vaut « ${String(trad)} » au lieu de « ${String(ref)} » (seuls les textes se traduisent)`);
  }
}

function chargerModule(dossier: string, langues: Langue[], vars: Record<Langue, Record<string, string>>): ModuleComplet {
  const ref = vars.fr;
  const meta = lireJson(join(dossier, 'module.json'), moduleSchema, ref);
  const nomDossier = dossier.split(/[\\/]/).pop();
  if (meta.id !== nomDossier) throw new ErreurConfig(`${dossier} : l'id « ${meta.id} » doit être identique au nom du dossier`);

  exiger(join(dossier, 'standard.fr.md'), 'version standard du module');
  exiger(join(dossier, 'falc.fr.md'), 'version FALC obligatoire pour chaque module');
  exiger(join(dossier, 'quiz.json'), 'pré-test et post-test obligatoires');

  // Fichiers de référence (français) : quiz.json, scenario.json ; traductions : quiz.en.json…
  const parLangue = <T,>(lire: (l: Langue) => T | undefined): ParLangue<T> => {
    const r = { fr: lire('fr')! } as ParLangue<T>;
    for (const l of langues) {
      if (l === 'fr') continue;
      const v = lire(l);
      if (v !== undefined) r[l] = v;
    }
    return r;
  };
  const markdown = (base: string) => (l: Langue) => {
    const f = join(dossier, `${base}.${l}.md`);
    return existsSync(f) ? lireMarkdown(f, vars[l]) : undefined;
  };
  const json = <T,>(base: string, schema: z.ZodType<T>) => (l: Langue) => {
    const f = join(dossier, l === 'fr' ? `${base}.json` : `${base}.${l}.json`);
    return existsSync(f) ? lireJson(f, schema, vars[l]) : undefined;
  };

  const quiz = parLangue(json('quiz', quizSchema));
  const aScenario = existsSync(join(dossier, 'scenario.json'));
  const scenario = aScenario ? parLangue(json('scenario', scenarioSchema)) : undefined;
  for (const l of langues) {
    if (l === 'fr') continue;
    if (quiz[l]) comparerStructure(quiz.fr, quiz[l], join(dossier, `quiz.${l}.json`));
    if (scenario?.[l]) comparerStructure(scenario.fr, scenario[l], join(dossier, `scenario.${l}.json`));
  }

  const transcriptions: Record<string, ParLangue<string>> = {};
  for (const media of meta.medias) {
    exiger(resolve(process.cwd(), 'public', media.fichier), `média ${media.id}`);
    exiger(resolve(process.cwd(), 'public', media.sousTitres), `sous-titres obligatoires du média ${media.id}`);
    exiger(join(dossier, media.transcription), `transcription obligatoire du média ${media.id}`);
    transcriptions[media.id] = parLangue(markdown(media.transcription.replace(/\.fr\.md$/, '')));
  }
  if (scenario?.fr.type === 'embranchements') {
    for (const etape of scenario.fr.etapes) {
      if (etape.media && !meta.medias.some((m) => m.id === etape.media)) {
        throw new ErreurConfig(`${join(dossier, 'scenario.json')} : média « ${etape.media} » non déclaré dans module.json`);
      }
    }
  }

  return {
    meta,
    dossier,
    standard: parLangue(markdown('standard')),
    falc: parLangue(markdown('falc')),
    quiz,
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
  const langues: Langue[] = [...new Set<Langue>(['fr', ...config.langues.disponibles])];
  const varsParLangue = Object.fromEntries(langues.map((l) => [l, variables(config, l)])) as Record<Langue, Record<string, string>>;
  const vars = varsParLangue.fr;

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
  const modules = dossiers.map((d) => chargerModule(d, langues, varsParLangue)).sort((a, b) => a.meta.ordre - b.meta.ordre);

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

  // Pages éditoriales (accueil, déclaration d'accessibilité, confidentialité), par langue
  const pages: Record<string, ParLangue<string>> = {};
  const dossierPages = join(racine, 'pages');
  if (existsSync(dossierPages)) {
    for (const f of readdirSync(dossierPages).filter((f) => f.endsWith('.fr.md'))) {
      const nom = f.replace(/\.fr\.md$/, '');
      const page = { fr: lireMarkdown(join(dossierPages, f), vars) } as ParLangue<string>;
      for (const l of langues) {
        const trad = join(dossierPages, `${nom}.${l}.md`);
        if (l !== 'fr' && existsSync(trad)) page[l] = lireMarkdown(trad, varsParLangue[l]);
      }
      pages[nom] = page;
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
