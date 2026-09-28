/**
 * Textes multilingues.
 * Dans les fichiers JSON, un texte peut être :
 *  - une chaîne simple (langue par défaut, le français) ;
 *  - un objet { "fr": "...", "en": "..." } quand une traduction existe.
 */
import { z } from 'zod';

export const LANGUES = ['fr', 'en'] as const;
export type Langue = (typeof LANGUES)[number];
export const LANGUE_PAR_DEFAUT: Langue = 'fr';

export const texteSchema = z.union([
  z.string().trim().min(1),
  z.strictObject({
    fr: z.string().trim().min(1),
    en: z.string().trim().min(1).optional(),
  }),
]);
export type Texte = z.infer<typeof texteSchema>;

/** Renvoie le texte dans la langue demandée, sinon en français. */
export function tr(texte: Texte, langue: Langue = LANGUE_PAR_DEFAUT): string {
  if (typeof texte === 'string') return texte;
  return texte[langue] ?? texte.fr;
}

/** Identifiant technique : minuscules, chiffres et tirets (sert dans les URL). */
export const identifiantSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'identifiant attendu en minuscules, chiffres et tirets (ex. « fraude-president »)');
