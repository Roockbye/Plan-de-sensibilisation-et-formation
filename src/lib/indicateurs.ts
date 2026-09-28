/**
 * Population FICTIVE et indicateurs du tableau de bord RSSI.
 * Aucune donnée réelle n'est collectée : les résultats sont générés de façon déterministe
 * (graine de la configuration) à partir de l'effectif, des profils et des parcours.
 */
import type { Config } from './config.ts';
import type { Action } from './calendrier.ts';
import type { Parcours } from './parcours.ts';

export type Statut = 'termine' | 'en-cours' | 'non-commence';

interface Suivi {
  module: string;
  statut: Statut;
  enRetard: boolean;
  scorePre?: number;
  scorePost?: number;
}

interface Personne {
  profil: string;
  suivis: Suivi[];
}

export interface IndicateurProfil {
  profil: string;
  effectif: number;
  modulesAssignes: number;
  modulesTermines: number;
  tauxCompletion: number;
  scorePreMoyen: number;
  scorePostMoyen: number;
  tauxReussite: number;
  personnesEnRetard: number;
}

export interface IndicateurModule {
  module: string;
  assignes: number;
  termines: number;
  enRetard: number;
  tauxCompletion: number;
  scorePreMoyen: number;
  scorePostMoyen: number;
}

export interface ResultatSimulation {
  id: string;
  date: string;
  participants: number;
  clics: number;
  signalements: number;
  tauxClic: number;
  tauxSignalement: number;
}

export interface Retard {
  module: string;
  profil: string;
  personnes: number;
}

export interface TableauDeBord {
  dateReference: string;
  effectifTotal: number;
  global: { tauxCompletion: number; scorePreMoyen: number; scorePostMoyen: number; tauxReussite: number; personnesEnRetard: number };
  parProfil: IndicateurProfil[];
  parModule: IndicateurModule[];
  simulations: ResultatSimulation[];
  retards: Retard[];
  prochainesActions: Action[];
}

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function generateur(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normale(alea: () => number, moyenne: number, ecart: number): number {
  const u = 1 - alea();
  const v = alea();
  return moyenne + ecart * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const borner = (v: number, min = 0, max = 100) => Math.round(Math.min(max, Math.max(min, v)));
const moyenne = (l: number[]) => (l.length ? Math.round(l.reduce((s, v) => s + v, 0) / l.length) : 0);
const pourcent = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);

function joursEntre(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

/** Répartit l'effectif entre les profils actifs selon leur part (normalisée). */
export function repartirEffectif(effectif: number, parcours: Parcours[]): Map<string, number> {
  const total = parcours.reduce((s, p) => s + p.profil.partEffectif, 0) || 1;
  return new Map(parcours.map((p) => [p.profil.id, Math.max(1, Math.round((effectif * p.profil.partEffectif) / total))]));
}

export function genererTableauDeBord(config: Config, parcours: Parcours[], calendrier: Action[], aujourdhui = new Date().toISOString().slice(0, 10)): TableauDeBord {
  const alea = generateur(config.demo.graine);
  const dateReference = config.demo.dateReference ?? aujourdhui;
  const { debut } = config.campagnes;
  const joursDepuisDebut = Math.max(0, joursEntre(debut, dateReference));
  const effectifs = repartirEffectif(config.organisation.effectif, parcours);
  const seuil = config.evaluation.seuilReussite;

  const personnes: Personne[] = [];
  for (const p of parcours) {
    // Chaque profil a son propre niveau d'engagement fictif, pour rendre les écarts visibles.
    const engagement = 0.5 + alea() * 0.35;
    const niveauInitial = 42 + alea() * 22;
    for (let i = 0; i < (effectifs.get(p.profil.id) ?? 0); i++) {
      const assiduite = Math.min(1, Math.max(0, normale(alea, engagement, 0.18)));
      const suivis: Suivi[] = p.etapes.map((e, rang) => {
        // Les modules du début de parcours et les modules obligatoires sont plus souvent terminés.
        const bonus = (e.categorie === 'obligatoire' ? 0.15 : 0) - rang * 0.04;
        const tirage = alea();
        const statut: Statut = tirage < assiduite + bonus ? 'termine' : tirage < assiduite + bonus + 0.2 ? 'en-cours' : 'non-commence';
        const scorePre = statut === 'non-commence' ? undefined : borner(normale(alea, niveauInitial, 14));
        const scorePost = statut === 'termine' && scorePre !== undefined ? borner(scorePre + normale(alea, 24, 11), 20) : undefined;
        return { module: e.module.id, statut, scorePre, scorePost, enRetard: statut !== 'termine' && joursDepuisDebut > config.evaluation.delaiRetardJours };
      });
      personnes.push({ profil: p.profil.id, suivis });
    }
  }

  const indicateursDe = (liste: Personne[]) => {
    const suivis = liste.flatMap((x) => x.suivis);
    const termines = suivis.filter((s) => s.statut === 'termine');
    return {
      assignes: suivis.length,
      termines: termines.length,
      tauxCompletion: pourcent(termines.length, suivis.length),
      scorePreMoyen: moyenne(suivis.flatMap((s) => (s.scorePre === undefined ? [] : [s.scorePre]))),
      scorePostMoyen: moyenne(termines.flatMap((s) => (s.scorePost === undefined ? [] : [s.scorePost]))),
      tauxReussite: pourcent(termines.filter((s) => (s.scorePost ?? 0) >= seuil).length, termines.length),
      personnesEnRetard: liste.filter((x) => x.suivis.some((s) => s.enRetard)).length,
    };
  };

  const parProfil: IndicateurProfil[] = parcours.map((p) => {
    const liste = personnes.filter((x) => x.profil === p.profil.id);
    const ind = indicateursDe(liste);
    return { profil: p.profil.id, effectif: liste.length, modulesAssignes: ind.assignes, modulesTermines: ind.termines, ...ind };
  });

  const idsModules = [...new Set(parcours.flatMap((p) => p.etapes.map((e) => e.module.id)))];
  const parModule: IndicateurModule[] = idsModules.map((id) => {
    const suivis = personnes.flatMap((x) => x.suivis.filter((s) => s.module === id));
    const termines = suivis.filter((s) => s.statut === 'termine');
    return {
      module: id,
      assignes: suivis.length,
      termines: termines.length,
      enRetard: suivis.filter((s) => s.enRetard).length,
      tauxCompletion: pourcent(termines.length, suivis.length),
      scorePreMoyen: moyenne(suivis.flatMap((s) => (s.scorePre === undefined ? [] : [s.scorePre]))),
      scorePostMoyen: moyenne(termines.flatMap((s) => (s.scorePost === undefined ? [] : [s.scorePost]))),
    };
  });

  const retards: Retard[] = [];
  for (const p of parcours) {
    for (const e of p.etapes) {
      const n = personnes.filter((x) => x.profil === p.profil.id && x.suivis.some((s) => s.module === e.module.id && s.enRetard)).length;
      if (n > 0) retards.push({ module: e.module.id, profil: p.profil.id, personnes: n });
    }
  }
  retards.sort((a, b) => b.personnes - a.personnes);

  // Simulations passées : le taux de clic baisse et le signalement progresse au fil des campagnes.
  const simulations: ResultatSimulation[] = calendrier
    .filter((a) => a.type === 'simulation' && a.date <= dateReference)
    .map((a, k) => {
      const participants = personnes.length;
      // Tendance attendue d'une campagne efficace, avec un faible bruit (± 2 points).
      const bruit = () => (alea() - 0.5) * 0.04;
      const clics = Math.round(participants * Math.max(0, 0.3 * 0.7 ** k + bruit()));
      const signalements = Math.round(participants * Math.min(0.8, 0.28 + 0.15 * k + bruit()));
      return { id: a.id, date: a.date, participants, clics, signalements, tauxClic: pourcent(clics, participants), tauxSignalement: pourcent(signalements, participants) };
    });

  const g = indicateursDe(personnes);
  return {
    dateReference,
    effectifTotal: personnes.length,
    global: { tauxCompletion: g.tauxCompletion, scorePreMoyen: g.scorePreMoyen, scorePostMoyen: g.scorePostMoyen, tauxReussite: g.tauxReussite, personnesEnRetard: g.personnesEnRetard },
    parProfil,
    parModule,
    simulations,
    retards,
    prochainesActions: calendrier.filter((a) => a.date > dateReference).slice(0, 4),
  };
}
