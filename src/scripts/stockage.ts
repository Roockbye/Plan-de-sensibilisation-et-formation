/**
 * Progression de l'apprenant, conservée UNIQUEMENT dans le navigateur (localStorage).
 * Aucune donnée n'est transmise. Toute valeur relue est validée avant usage.
 */

export interface Resultat {
  score: number;
  total: number;
  pourcent: number;
  date: string;
}

export interface SuiviModule {
  pretest?: Resultat;
  posttest?: Resultat;
  meilleurPosttest?: Resultat;
  scenario?: Resultat;
  valide?: boolean;
  /** Étapes du module marquées comme terminées (ex. « essentiel » lu), pour reprendre au bon endroit. */
  etapes?: string[];
}

export interface Progression {
  profil?: string;
  modules: Record<string, SuiviModule>;
}

const cleProgression = () => `ssi:${document.documentElement.dataset.org ?? 'defaut'}:progression`;

const estIdentifiant = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9-]{1,60}$/.test(v);

function lireResultat(v: unknown): Resultat | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const r = v as Record<string, unknown>;
  const n = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1000;
  if (!n(r.score) || !n(r.total) || !n(r.pourcent) || typeof r.date !== 'string') return undefined;
  return { score: r.score as number, total: r.total as number, pourcent: r.pourcent as number, date: String(r.date).slice(0, 30) };
}

export function lireProgression(): Progression {
  const vide: Progression = { modules: {} };
  try {
    const brut = JSON.parse(localStorage.getItem(cleProgression()) ?? 'null');
    if (!brut || typeof brut !== 'object') return vide;
    const modules: Record<string, SuiviModule> = {};
    for (const [id, s] of Object.entries((brut as { modules?: object }).modules ?? {})) {
      if (!estIdentifiant(id) || !s || typeof s !== 'object') continue;
      const suivi = s as Record<string, unknown>;
      modules[id] = {
        pretest: lireResultat(suivi.pretest),
        posttest: lireResultat(suivi.posttest),
        meilleurPosttest: lireResultat(suivi.meilleurPosttest),
        scenario: lireResultat(suivi.scenario),
        valide: suivi.valide === true,
        etapes: Array.isArray(suivi.etapes) ? suivi.etapes.filter(estIdentifiant).slice(0, 10) : [],
      };
    }
    const profil = (brut as { profil?: unknown }).profil;
    return { profil: estIdentifiant(profil) ? profil : undefined, modules };
  } catch {
    return vide;
  }
}

/** Enregistre ; renvoie false si le stockage est indisponible (navigation privée, quota…). */
export function ecrireProgression(p: Progression): boolean {
  try {
    localStorage.setItem(cleProgression(), JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

export function majModule(id: string, modifier: (s: SuiviModule) => void): boolean {
  const p = lireProgression();
  const suivi = p.modules[id] ?? {};
  modifier(suivi);
  p.modules[id] = suivi;
  return ecrireProgression(p);
}

export function effacerProgression(): void {
  try {
    localStorage.removeItem(cleProgression());
  } catch {
    /* rien à effacer */
  }
}

export const resultat = (score: number, total: number): Resultat => ({
  score,
  total,
  pourcent: total ? Math.round((100 * score) / total) : 0,
  date: new Date().toISOString(),
});

/** Libellés passés par le serveur (dictionnaire i18n) via un attribut data-libelles. */
export function libelles(element: HTMLElement): Record<string, string> {
  try {
    return JSON.parse(element.dataset.libelles ?? '{}');
  } catch {
    return {};
  }
}

export const formater = (modele: string | undefined, params: Record<string, string | number>) =>
  (modele ?? '').replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
