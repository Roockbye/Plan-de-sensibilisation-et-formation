/**
 * Textes de l'interface. Le français est la référence ; une clé absente d'une autre
 * langue retombe sur le français. Pour traduire : compléter en.json (mêmes clés).
 */
import fr from './fr.json';
import en from './en.json';
import type { Langue } from '../lib/texte.ts';

export type Cle = keyof typeof fr;

const dictionnaires: Record<Langue, Partial<Record<Cle, string>>> = { fr, en };

export function t(cle: Cle, langue: Langue = 'fr', params: Record<string, string | number> = {}): string {
  const brut = dictionnaires[langue][cle] ?? fr[cle];
  return brut.replace(/\{(\w+)\}/g, (m, nom: string) => (nom in params ? String(params[nom]) : m));
}

/** Traducteur lié à une langue : `const T = traducteur('fr'); T('nav.accueil')`. */
export const traducteur = (langue: Langue) => (cle: Cle, params?: Record<string, string | number>) => t(cle, langue, params);
