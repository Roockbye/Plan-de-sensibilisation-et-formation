/**
 * Module par étapes (amélioration progressive).
 * Sans JavaScript, toutes les étapes restent visibles et les ancres font défiler la page.
 * Avec JavaScript : une étape à la fois, adresse propre à chaque étape (#pretest…), reprise
 * à la première étape non terminée, états écrits en toutes lettres et carte PARADE retournée
 * quand le module est validé.
 */
import { lireProgression, majModule, type SuiviModule } from './stockage.ts';

const nav = document.querySelector<HTMLElement>('[data-etapes]');

if (nav) {
  const module = nav.dataset.etapes!;
  let L: Record<string, string> = {};
  try {
    L = JSON.parse(nav.dataset.libelles ?? '{}');
  } catch {
    /* libellés par défaut vides */
  }
  const sections = [...document.querySelectorAll<HTMLElement>('section.etape')];
  const ids = sections.map((s) => s.dataset.etape!);
  const carte = document.querySelector<HTMLElement>(`[data-carte-parade="${CSS.escape(module)}"]`);
  const annonce = carte?.querySelector<HTMLElement>('[data-annonce-parade]');
  let active = '';
  let gagneeAuChargement: boolean | undefined;

  const suivi = (): SuiviModule | undefined => lireProgression().modules[module];

  const estFaite = (id: string, s?: SuiviModule): boolean => {
    if (id === 'pretest') return Boolean(s?.pretest);
    if (id === 'posttest') return Boolean(s?.valide);
    if (id === 'situation') return Boolean(s?.scenario) || Boolean(s?.etapes?.includes(id));
    return Boolean(s?.etapes?.includes(id));
  };

  const premiereAFaire = () => {
    const s = suivi();
    return ids.find((id) => !estFaite(id, s)) ?? ids[ids.length - 1];
  };

  function majEtats() {
    const s = suivi();
    for (const a of nav!.querySelectorAll<HTMLAnchorElement>('a[data-lien-etape]')) {
      const id = a.dataset.lienEtape!;
      const faite = estFaite(id, s);
      const etat = a.querySelector<HTMLElement>('[data-etat-etape]');
      if (etat) etat.textContent = faite ? L.fait ?? '' : id === active ? L.enCours ?? '' : L.aFaire ?? '';
      a.classList.toggle('est-faite', faite);
      if (id === active) a.setAttribute('aria-current', 'step');
      else a.removeAttribute('aria-current');
    }
    // Carte PARADE : face cachée tant que le module n'est pas validé.
    if (carte) {
      const gagnee = Boolean(s?.valide);
      if (gagneeAuChargement === undefined) gagneeAuChargement = gagnee;
      carte.dataset.etat = gagnee ? 'gagnee' : 'a-gagner';
      if (gagnee && !gagneeAuChargement && !carte.classList.contains('retournee')) {
        carte.classList.add('retournee'); // déclenche le retournement (désactivé si animations réduites)
        if (annonce) annonce.textContent = L.gagnees ?? '';
      }
    }
  }

  function afficher(id: string, focus: boolean) {
    if (!ids.includes(id)) return;
    active = id;
    for (const section of sections) section.hidden = section.dataset.etape !== id;
    majEtats();
    if (focus) document.getElementById(`titre-${id}`)?.focus();
  }

  // « Étape suivante » : l'étape quittée est marquée comme terminée (utile pour l'essentiel, sans score).
  document.addEventListener('click', (evt) => {
    const lien = (evt.target as HTMLElement).closest<HTMLAnchorElement>('a[data-terminer-etape]');
    if (!lien) return;
    const id = lien.dataset.terminerEtape!;
    majModule(module, (s) => {
      s.etapes = [...new Set([...(s.etapes ?? []), id])];
    });
  });

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (ids.includes(id)) afficher(id, true);
  });
  document.addEventListener('ssi:progression', majEtats);

  nav.classList.add('etapes--actives');
  const demandee = location.hash.slice(1);
  afficher(ids.includes(demandee) ? demandee : premiereAFaire(), false);
}
