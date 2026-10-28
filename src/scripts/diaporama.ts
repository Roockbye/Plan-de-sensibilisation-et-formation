/**
 * Diaporama accessible du support de présentation.
 * - Sans ce script, toutes les diapositives restent visibles à la suite.
 * - Une diapositive à la fois : boutons, flèches gauche/droite, Page préc./suiv., Début, Fin.
 * - Le compteur est une zone de statut (annoncée) ; le focus va au titre de la nouvelle diapositive.
 * - L'adresse garde la diapositive courante (#diapo-3) : lien direct et retour arrière.
 */
const deck = document.querySelector<HTMLElement>('[data-diaporama]');

if (deck) {
  const L = JSON.parse(deck.dataset.libelles ?? '{}') as Record<string, string>;
  const diapos = [...deck.querySelectorAll<HTMLElement>('[data-diapo]')];
  const barre = deck.querySelector<HTMLElement>('[data-barre]')!;
  const compteur = deck.querySelector<HTMLElement>('[data-compteur]')!;
  const precedente = deck.querySelector<HTMLButtonElement>('[data-precedente]')!;
  const suivante = deck.querySelector<HTMLButtonElement>('[data-suivante]')!;
  const pleinEcran = deck.querySelector<HTMLButtonElement>('[data-plein-ecran]')!;
  const mode = deck.querySelector<HTMLButtonElement>('[data-mode]')!;
  let courante = 0;
  let uneParUne = true;

  const depuisAdresse = () => {
    const i = diapos.findIndex((x) => `#${x.id}` === location.hash);
    return i >= 0 ? i : 0;
  };

  function afficher(i: number, focus: boolean, initial = false) {
    courante = Math.max(0, Math.min(diapos.length - 1, i));
    diapos.forEach((x, k) => (x.hidden = uneParUne && k !== courante));
    compteur.textContent = uneParUne ? (L.compteur ?? '').replace('{n}', String(courante + 1)).replace('{total}', String(diapos.length)) : '';
    // Un bouton désactivé perd le focus : on le reporte sur le titre de la diapositive.
    const perdu = document.activeElement === precedente || document.activeElement === suivante;
    precedente.disabled = !uneParUne || courante === 0;
    suivante.disabled = !uneParUne || courante === diapos.length - 1;
    // Pas au chargement : le navigateur défilerait vers l'ancre ajoutée.
    if (uneParUne && !initial) history.replaceState(null, '', `#${diapos[courante].id}`);
    if (focus || (perdu && (precedente.disabled || suivante.disabled) && document.activeElement === document.body)) {
      diapos[courante].querySelector<HTMLElement>('h2')?.focus();
    }
  }

  precedente.addEventListener('click', () => afficher(courante - 1, false));
  suivante.addEventListener('click', () => afficher(courante + 1, false));
  mode.addEventListener('click', () => {
    uneParUne = !uneParUne;
    mode.textContent = uneParUne ? L.toutAfficher : L.uneParUne;
    deck.classList.toggle('diaporama--une', uneParUne);
    afficher(courante, true);
  });

  deck.addEventListener('keydown', (e) => {
    if (!uneParUne || e.altKey || e.ctrlKey || e.metaKey) return;
    const cible = e.target as HTMLElement;
    if (cible.closest('input, textarea, select, [contenteditable="true"]')) return;
    const actions: Record<string, number> = { ArrowRight: courante + 1, PageDown: courante + 1, ArrowLeft: courante - 1, PageUp: courante - 1, Home: 0, End: diapos.length - 1 };
    if (!(e.key in actions)) return;
    e.preventDefault();
    afficher(actions[e.key], true);
  });

  if (document.fullscreenEnabled) {
    pleinEcran.hidden = false;
    pleinEcran.addEventListener('click', () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void deck.requestFullscreen();
    });
    document.addEventListener('fullscreenchange', () => {
      pleinEcran.textContent = document.fullscreenElement ? L.quitterPleinEcran : L.pleinEcran;
      diapos[courante].querySelector<HTMLElement>('h2')?.focus();
    });
  }

  window.addEventListener('hashchange', () => afficher(depuisAdresse(), true));

  barre.hidden = false;
  deck.classList.add('diaporama--une');
  afficher(depuisAdresse(), false, true);
}
