/**
 * Accès aux données dérivées, utilisées par les pages : parcours, calendrier, indicateurs…
 * Tout est calculé à partir de la configuration et des contenus, dans la langue demandée.
 */
import { enLangue, plateforme, type ModuleComplet, type ParLangue } from './contenus.ts';
import { calculerParcours, type Parcours } from './parcours.ts';
import { genererCalendrier, libelleType, texteAction, type Action } from './calendrier.ts';
import { genererTableauDeBord, type TableauDeBord } from './indicateurs.ts';
import { LANGUE_PAR_DEFAUT, tr, type Langue, type Texte } from './texte.ts';
import { LOCALES } from './personnalisation.ts';
import { traducteur, type Cle } from '../i18n/index.ts';

/** Langues publiées : la langue par défaut à la racine du site, les autres sous /<langue>/. */
export function languesPubliees() {
  const { config } = plateforme();
  const defaut = config.langues.defaut;
  return { defaut, autres: config.langues.disponibles.filter((l) => l !== defaut) };
}

/** Chemin d'une page dans une langue (préfixe /en/ hors langue par défaut). */
export function lienLangue(langue: Langue, chemin: string): string {
  return langue === languesPubliees().defaut ? chemin : `/${langue}${chemin}`;
}

/** Retire le préfixe de langue d'un chemin (pour construire le lien vers l'autre langue). */
export function cheminSansLangue(chemin: string): string {
  const { autres } = languesPubliees();
  for (const l of autres) if (chemin === `/${l}/` || chemin.startsWith(`/${l}/`)) return chemin.slice(l.length + 1);
  return chemin;
}

export function formaterDate(iso: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }, langue: Langue = LANGUE_PAR_DEFAUT): string {
  return new Intl.DateTimeFormat(LOCALES[langue], { ...options, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}

export function donnees(langue: Langue = languesPubliees().defaut) {
  const p = plateforme();
  const T = traducteur(langue);
  const metas = p.modules.map((m) => m.meta);

  const parcours: Parcours[] = p.profils.map((profil) => calculerParcours(profil, metas, p.config));
  const calendrier: Action[] = genererCalendrier(p.config, metas);
  const tableauDeBord = (): TableauDeBord => genererTableauDeBord(p.config, parcours, calendrier);

  const tx = (v: Texte) => tr(v, langue);
  /** Langue réellement servie pour un texte (repli sur le français si la traduction manque). */
  const langueDe = (v: Texte): Langue => (typeof v === 'object' && v[langue] ? langue : LANGUE_PAR_DEFAUT);
  const contenu = <T,>(v: ParLangue<T>) => enLangue(v, langue);

  const module = (id: string): ModuleComplet => {
    const m = p.modules.find((x) => x.meta.id === id);
    if (!m) throw new Error(`Module inconnu : ${id}`);
    return m;
  };
  const risque = (id: string) => p.risques.find((r) => r.id === id);
  const libelleRisque = (id: string) => {
    const r = risque(id);
    return r ? tx(r.libelle) : id;
  };
  const libelleProfil = (id: string) => {
    const pr = p.profils.find((x) => x.id === id);
    return pr ? tx(pr.libelle) : id;
  };
  const libelleModule = (id: string) => {
    const m = p.modules.find((x) => x.meta.id === id);
    return m ? `${m.meta.code} – ${tx(m.meta.titre)}` : id;
  };
  const prioriteRisque = (id: string) => p.config.risquesPrioritaires.find((r) => r.id === id)?.priorite;

  return {
    ...p,
    langue,
    T,
    parcours,
    calendrier,
    tableauDeBord,
    module,
    risque,
    libelleRisque,
    libelleProfil,
    libelleModule,
    prioriteRisque,
    tr: tx,
    langueDe,
    contenu,
    lien: (chemin: string) => lienLangue(langue, chemin),
    date: (iso: string, options?: Intl.DateTimeFormatOptions) => formaterDate(iso, options, langue),
    frequence: (f: string) => T(`frequence.${f}` as Cle),
    priorite: (n: 1 | 2 | 3) => T(`priorite.${n}` as Cle),
    typeAction: (a: Action) => libelleType(a.type, langue),
    texteAction: (a: Action) => texteAction(a, langue),
  };
}

export type Donnees = ReturnType<typeof donnees>;
