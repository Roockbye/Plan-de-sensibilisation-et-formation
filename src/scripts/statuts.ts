/**
 * Affiche le statut de chaque module (À faire / En cours / Validé) à partir de la progression locale.
 * Le statut est toujours un TEXTE (la couleur n'est qu'un complément).
 * Les libellés et le préfixe de langue sont fournis par la page (attributs data-*).
 */
import { lireProgression } from './stockage.ts';

type CleStatut = 'aFaire' | 'enCours' | 'valide';

function libelles(): Record<CleStatut | 'posttest', string> {
  try {
    return JSON.parse(document.body.dataset.libellesStatut ?? '{}');
  } catch {
    return { aFaire: '', enCours: '', valide: '', posttest: '' };
  }
}

export function statutModule(id: string): { cle: CleStatut; pourcent?: number } {
  const s = lireProgression().modules[id];
  if (s?.valide) return { cle: 'valide', pourcent: s.meilleurPosttest?.pourcent };
  if (s && (s.pretest || s.posttest || s.scenario)) return { cle: 'enCours' };
  return { cle: 'aFaire' };
}

function actualiser() {
  const L = libelles();
  for (const el of document.querySelectorAll<HTMLElement>('[data-statut-module]')) {
    const { cle, pourcent } = statutModule(el.dataset.statutModule!);
    el.textContent = L[cle] + (pourcent !== undefined ? ` (${L.posttest} : ${pourcent} %)` : '');
    el.classList.toggle('statut--termine', cle === 'valide');
    el.classList.toggle('statut--en-cours', cle === 'enCours');
  }
  // Préférence « version FALC en priorité » : les liens vers les modules pointent vers la version FALC.
  const falc = document.documentElement.dataset.version === 'falc';
  const prefixe = document.documentElement.dataset.prefixe ?? '';
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-lien-module]')) {
    a.href = `${prefixe}/modules/${a.dataset.lienModule}/${falc ? 'facile/' : ''}`;
  }
}

actualiser();
document.addEventListener('ssi:progression', actualiser);
