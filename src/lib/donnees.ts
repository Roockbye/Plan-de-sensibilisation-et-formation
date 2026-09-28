/**
 * Accès aux données dérivées, utilisées par les pages : parcours, calendrier, indicateurs…
 * Tout est calculé à partir de la configuration et des contenus.
 */
import { plateforme, type ModuleComplet } from './contenus.ts';
import { calculerParcours, type Parcours } from './parcours.ts';
import { genererCalendrier, type Action } from './calendrier.ts';
import { genererTableauDeBord, type TableauDeBord } from './indicateurs.ts';
import { tr } from './texte.ts';

export function donnees() {
  const p = plateforme();
  const langue = p.config.langues.defaut;
  const metas = p.modules.map((m) => m.meta);

  const parcours: Parcours[] = p.profils.map((profil) => calculerParcours(profil, metas, p.config));
  const calendrier: Action[] = genererCalendrier(p.config, metas);
  const tableauDeBord = (): TableauDeBord => genererTableauDeBord(p.config, parcours, calendrier);

  const module = (id: string): ModuleComplet => {
    const m = p.modules.find((x) => x.meta.id === id);
    if (!m) throw new Error(`Module inconnu : ${id}`);
    return m;
  };
  const risque = (id: string) => p.risques.find((r) => r.id === id);
  const libelleRisque = (id: string) => {
    const r = risque(id);
    return r ? tr(r.libelle, langue) : id;
  };
  const libelleProfil = (id: string) => {
    const pr = p.profils.find((x) => x.id === id);
    return pr ? tr(pr.libelle, langue) : id;
  };
  const libelleModule = (id: string) => {
    const m = p.modules.find((x) => x.meta.id === id);
    return m ? `${m.meta.code} – ${tr(m.meta.titre, langue)}` : id;
  };
  const prioriteRisque = (id: string) => p.config.risquesPrioritaires.find((r) => r.id === id)?.priorite;
  const tx = (v: Parameters<typeof tr>[0]) => tr(v, langue);

  return { ...p, langue, parcours, calendrier, tableauDeBord, module, risque, libelleRisque, libelleProfil, libelleModule, prioriteRisque, tr: tx };
}

export const LIBELLES_PRIORITE: Record<1 | 2 | 3, string> = { 1: 'Priorité faible', 2: 'Priorité moyenne', 3: 'Priorité haute' };

export const FREQUENCE_LIBELLE: Record<string, string> = {
  mensuelle: 'Tous les mois',
  trimestrielle: 'Tous les trimestres',
  semestrielle: 'Tous les six mois',
  annuelle: 'Tous les ans',
};

export function formaterDate(iso: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  return new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}
