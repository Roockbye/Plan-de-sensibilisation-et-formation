/**
 * Calendrier annuel des actions de sensibilisation, généré à partir de la configuration :
 * fréquences des campagnes + risques prioritaires + fréquence de renouvellement de chaque module.
 */
import type { Config } from './config.ts';
import type { ModuleMeta } from './schemas.ts';
import type { Langue } from './texte.ts';
import { t, type Cle } from '../i18n/index.ts';

export type TypeAction = 'lancement' | 'accueil' | 'simulation' | 'rappel' | 'veille' | 'crise' | 'bilan';
export type CleAction = TypeAction | 'renouvellement';

export interface Action {
  id: string;
  date: string; // AAAA-MM-JJ
  type: TypeAction;
  /** Clé des textes dans le dictionnaire (src/i18n) et paramètres associés. */
  cle: CleAction;
  params: Record<string, string | number>;
  /** Profils concernés ; vide = tous. */
  profils: string[];
  modules: string[];
}

export const MOIS_PAR_FREQUENCE = { mensuelle: 1, trimestrielle: 3, semestrielle: 6, annuelle: 12 } as const;

/** Libellé du type d'action, dans la langue demandée. */
export const libelleType = (type: TypeAction, langue: Langue = 'fr') => t(`calendrier.type.${type}` as Cle, langue);

/** Titre et description d'une action, dans la langue demandée. */
export function texteAction(a: Action, langue: Langue = 'fr'): { titre: string; description: string } {
  const params = { ...a.params };
  if (typeof params.frequence === 'string') params.frequence = t(`frequence.adjectif.${params.frequence}` as Cle, langue);
  return {
    titre: t(`calendrier.${a.cle}.titre` as Cle, langue, params),
    description: t(`calendrier.${a.cle}.description` as Cle, langue, params),
  };
}

/** Ajoute des mois à une date ISO en restant sur un jour ouvré (lundi à vendredi). */
export function ajouterMois(dateIso: string, mois: number, decalageJours = 0): string {
  const [a, m, j] = dateIso.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1 + mois, Math.min(j, 28) + decalageJours));
  const jour = d.getUTCDay();
  if (jour === 6) d.setUTCDate(d.getUTCDate() + 2);
  if (jour === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Priorité d'un module = priorité maximale des risques qu'il couvre (0 si aucun n'est prioritaire). */
function prioriteModule(m: ModuleMeta, config: Config): number {
  return Math.max(0, ...config.risquesPrioritaires.filter((r) => m.risques.includes(r.id)).map((r) => r.priorite));
}

export function genererCalendrier(config: Config, modules: ModuleMeta[]): Action[] {
  const { campagnes } = config;
  const debut = campagnes.debut;
  const actions: Action[] = [];

  actions.push({
    id: 'lancement',
    date: debut,
    type: 'lancement',
    cle: 'lancement',
    params: {},
    profils: [],
    modules: [],
  });

  actions.push({
    id: 'accueil',
    date: debut,
    type: 'accueil',
    cle: 'accueil',
    params: { jours: campagnes.onboardingDelaiJours },
    profils: ['nouvel-arrivant'],
    modules: modules.filter((m) => m.obligatoirePour.includes('nouvel-arrivant')).map((m) => m.id),
  });

  // Simulations d'hameçonnage pédagogiques (dans l'application uniquement).
  const pasSimu = MOIS_PAR_FREQUENCE[campagnes.simulationPhishing];
  for (let mois = 1, n = 1; mois < 12; mois += pasSimu, n++) {
    actions.push({
      id: `simulation-${n}`,
      date: ajouterMois(debut, mois, 7),
      type: 'simulation',
      cle: 'simulation',
      params: { n },
      profils: [],
      modules: modules.filter((m) => m.formats.includes('simulation-hameconnage')).map((m) => m.id),
    });
  }

  // Rappels : les modules sont répartis sur les campagnes, les plus prioritaires en premier.
  const pasRappel = MOIS_PAR_FREQUENCE[campagnes.rappelModules];
  const nbRappels = Math.max(1, Math.floor(11 / pasRappel));
  const ordonnes = [...modules].sort((a, b) => prioriteModule(b, config) - prioriteModule(a, config) || a.ordre - b.ordre);
  for (let i = 0; i < nbRappels; i++) {
    const lot = ordonnes.filter((_, idx) => idx % nbRappels === i);
    if (!lot.length) continue;
    actions.push({
      id: `rappel-${i + 1}`,
      date: ajouterMois(debut, (i + 1) * pasRappel - 1, 14),
      type: 'rappel',
      cle: 'rappel',
      params: { n: i + 1 },
      profils: [],
      modules: lot.map((m) => m.id),
    });
  }

  // Modules à renouveler plus d'une fois par an (ex. menaces émergentes).
  for (const m of modules) {
    const pas = MOIS_PAR_FREQUENCE[m.renouvellement];
    if (pas >= 12) continue;
    for (let mois = pas; mois < 12; mois += pas) {
      actions.push({
        id: `renouvellement-${m.id}-${mois}`,
        date: ajouterMois(debut, mois, 21),
        type: 'rappel',
        cle: 'renouvellement',
        params: { code: m.code, frequence: m.renouvellement },
        profils: m.profils,
        modules: [m.id],
      });
    }
  }

  const pasVeille = MOIS_PAR_FREQUENCE[campagnes.veilleNouvellesMenaces];
  for (let mois = pasVeille, n = 1; mois <= 12; mois += pasVeille, n++) {
    actions.push({
      id: `veille-${n}`,
      date: ajouterMois(debut, mois - 1, 0),
      type: 'veille',
      cle: 'veille',
      params: {},
      profils: [],
      modules: [],
    });
  }

  const pasCrise = MOIS_PAR_FREQUENCE[campagnes.exerciceCrise];
  for (let mois = Math.min(5, pasCrise - 1), n = 1; mois < 12; mois += pasCrise, n++) {
    actions.push({
      id: `crise-${n}`,
      date: ajouterMois(debut, mois, 10),
      type: 'crise',
      cle: 'crise',
      params: {},
      profils: ['manager', 'admin-it'],
      modules: modules.filter((m) => m.risques.includes('rancongiciel')).map((m) => m.id),
    });
  }

  actions.push({
    id: 'bilan',
    date: ajouterMois(debut, 11, 7),
    type: 'bilan',
    cle: 'bilan',
    params: {},
    profils: [],
    modules: [],
  });

  const profilsActifs = new Set(config.profilsActifs);
  return actions
    .map((a) => ({ ...a, profils: a.profils.filter((p) => profilsActifs.has(p)) }))
    .filter((a) => a.type !== 'accueil' || a.profils.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

/** Échappement des valeurs texte iCalendar (RFC 5545 §3.3.11). */
function echapperIcs(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Coupe les lignes à 75 octets (RFC 5545 §3.1). */
function plier(ligne: string): string {
  const octets = new TextEncoder().encode(ligne);
  if (octets.length <= 75) return ligne;
  const morceaux: string[] = [];
  let courant = '';
  for (const car of ligne) {
    if (new TextEncoder().encode(courant + car).length > (morceaux.length ? 74 : 75)) {
      morceaux.push(courant);
      courant = '';
    }
    courant += car;
  }
  morceaux.push(courant);
  return morceaux.join('\r\n ');
}

export function exporterIcs(actions: Action[], nomOrganisation: string, horodatage: string, langue: Langue = 'fr'): string {
  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Plateforme de sensibilisation SSI//FR',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${echapperIcs(`${t('site.titre', langue)} – ${nomOrganisation}`)}`,
  ];
  const stamp = horodatage.replace(/[-:]/g, '').slice(0, 15) + 'Z';
  for (const a of actions) {
    const jour = a.date.replace(/-/g, '');
    const { titre, description } = texteAction(a, langue);
    const lendemain = jourSuivantCompact(a.date);
    lignes.push(
      'BEGIN:VEVENT',
      `UID:${a.id}-${jour}@sensibilisation`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${jour}`,
      `DTEND;VALUE=DATE:${lendemain}`,
      `SUMMARY:${echapperIcs(titre)}`,
      `DESCRIPTION:${echapperIcs(description)}`,
      'END:VEVENT',
    );
  }
  lignes.push('END:VCALENDAR');
  return lignes.map(plier).join('\r\n') + '\r\n';
}

function jourSuivantCompact(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}
