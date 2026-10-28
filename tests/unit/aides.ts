import { readFileSync } from 'node:fs';

/**
 * Copie modifiable de la configuration générique (config/exemples/generique.json) :
 * les tests des algorithmes ne dépendent pas de l'organisation déployée (AéroStar).
 */
export function configExemple(): any {
  return JSON.parse(readFileSync('config/exemples/generique.json', 'utf8'));
}

/** Configuration déployée par défaut (config/organisation.json). */
export function configDeployee(): any {
  return JSON.parse(readFileSync('config/organisation.json', 'utf8'));
}
