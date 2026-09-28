/**
 * Affiche le statut de chaque module (À faire / En cours / Validé) à partir de la progression locale.
 * Le statut est toujours un TEXTE (la couleur n'est qu'un complément).
 */
import { lireProgression } from './stockage.ts';

const LIBELLES = { aFaire: 'À faire', enCours: 'En cours', valide: 'Validé' };

export function statutModule(id: string): { cle: keyof typeof LIBELLES; detail: string } {
  const s = lireProgression().modules[id];
  if (s?.valide) {
    return { cle: 'valide', detail: s.meilleurPosttest ? ` (post-test : ${s.meilleurPosttest.pourcent} %)` : '' };
  }
  if (s && (s.pretest || s.posttest || s.scenario)) return { cle: 'enCours', detail: '' };
  return { cle: 'aFaire', detail: '' };
}

function actualiser() {
  for (const el of document.querySelectorAll<HTMLElement>('[data-statut-module]')) {
    const { cle, detail } = statutModule(el.dataset.statutModule!);
    el.textContent = LIBELLES[cle] + detail;
    el.classList.toggle('statut--termine', cle === 'valide');
    el.classList.toggle('statut--en-cours', cle === 'enCours');
  }
  // Préférence « version FALC en priorité » : les liens vers les modules pointent vers la version FALC.
  const falc = document.documentElement.dataset.version === 'falc';
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-lien-module]')) {
    a.href = `/modules/${a.dataset.lienModule}/${falc ? 'facile/' : ''}`;
  }
}

actualiser();
document.addEventListener('ssi:progression', actualiser);
