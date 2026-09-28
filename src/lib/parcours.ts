/**
 * Moteur de parcours : croise l'analyse de risques de l'organisation (configuration)
 * avec les profils et les modules pour proposer un parcours ordonné et justifié.
 *
 * Règle (volontairement simple et explicable) :
 *   score(module, profil) = Σ priorité(risque) × (2 si le profil est exposé à ce risque, sinon 1)
 *   pour chaque risque du module qui figure dans les risques prioritaires de la configuration.
 *   1. modules obligatoires pour le profil (le « socle », dans l'ordre pédagogique) ;
 *   2. modules prioritaires (score > 0), triés par score décroissant ;
 *   3. modules complémentaires (aucun risque prioritaire couvert).
 */
import type { Config } from './config.ts';
import type { ModuleMeta, Profil } from './schemas.ts';

export type Categorie = 'obligatoire' | 'prioritaire' | 'complementaire';

export interface Raison {
  risque: string;
  priorite: 1 | 2 | 3;
  exposition: boolean;
  points: number;
}

export interface EtapeParcours {
  module: ModuleMeta;
  categorie: Categorie;
  score: number;
  raisons: Raison[];
}

export interface Parcours {
  profil: Profil;
  etapes: EtapeParcours[];
  dureeTotaleMinutes: number;
  /** Risques prioritaires qu'aucun module du parcours ne couvre : alerte pour le RSSI. */
  risquesNonCouverts: string[];
}

const RANG: Record<Categorie, number> = { obligatoire: 0, prioritaire: 1, complementaire: 2 };

export function scorer(module: ModuleMeta, profil: Profil, risquesPrioritaires: Config['risquesPrioritaires']): { score: number; raisons: Raison[] } {
  const raisons: Raison[] = [];
  for (const r of risquesPrioritaires) {
    if (!module.risques.includes(r.id)) continue;
    const exposition = profil.exposition.includes(r.id);
    raisons.push({ risque: r.id, priorite: r.priorite, exposition, points: r.priorite * (exposition ? 2 : 1) });
  }
  raisons.sort((a, b) => b.points - a.points);
  return { score: raisons.reduce((s, r) => s + r.points, 0), raisons };
}

export function calculerParcours(profil: Profil, modules: ModuleMeta[], config: Config): Parcours {
  const etapes: EtapeParcours[] = modules
    .filter((m) => m.profils.includes(profil.id))
    .map((module) => {
      const { score, raisons } = scorer(module, profil, config.risquesPrioritaires);
      const categorie: Categorie = module.obligatoirePour.includes(profil.id) ? 'obligatoire' : score > 0 ? 'prioritaire' : 'complementaire';
      return { module, categorie, score, raisons };
    })
    .sort((a, b) => {
      if (a.categorie !== b.categorie) return RANG[a.categorie] - RANG[b.categorie];
      if (a.categorie === 'obligatoire') return a.module.ordre - b.module.ordre;
      return b.score - a.score || a.module.ordre - b.module.ordre;
    });

  const couverts = new Set(etapes.flatMap((e) => e.module.risques));
  return {
    profil,
    etapes,
    dureeTotaleMinutes: etapes.reduce((s, e) => s + e.module.dureeMinutes, 0),
    risquesNonCouverts: config.risquesPrioritaires.map((r) => r.id).filter((id) => !couverts.has(id)),
  };
}
