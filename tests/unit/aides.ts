import { readFileSync } from 'node:fs';

/** Copie modifiable de la configuration par défaut. */
export function configExemple(): any {
  return JSON.parse(readFileSync('config/organisation.json', 'utf8'));
}
