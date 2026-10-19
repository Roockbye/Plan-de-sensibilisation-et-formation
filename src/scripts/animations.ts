/**
 * Apparition au défilement : éléments [data-apparition] et éléments de liste courants
 * (cartes, tuiles, indicateurs, graphiques, tableaux).
 * Garde-fous d'accessibilité :
 * - rien ne bouge si l'utilisateur réduit les animations (système ou préférences du site) ;
 * - un élément déjà visible au chargement n'est jamais déplacé (pas de contenu « en attente ») ;
 * - si ce script ne s'exécute pas, tout reste à sa place (la classe qui active l'effet est posée ici) ;
 * - seule la position change, jamais l'opacité : le contraste du texte reste constant.
 */
const SELECTEUR = [
  '[data-apparition]',
  '.grille > li', '.catalogue > li', '.collection__liste > li', '.indicateurs > li', '.parcours > li',
  '.graphique', 'main .tableau-defilant',
].join(', ');

const racine = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches || racine.dataset.animations === 'reduites';
const elements = [...document.querySelectorAll<HTMLElement>(SELECTEUR)];

if (!reduit && elements.length && 'IntersectionObserver' in window) {
  const hauteur = window.innerHeight;
  const aSurveiller: HTMLElement[] = [];
  for (const el of elements) {
    el.classList.add('apparition');
    if (el.getBoundingClientRect().top < hauteur) {
      el.classList.add('est-revele');
      continue;
    }
    // Léger décalage entre éléments voisins d'une même liste (effet de « distribution »).
    const rang = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    if (rang > 0) el.style.setProperty('--decalage', `${(rang % 4) * 70}ms`);
    aSurveiller.push(el);
  }
  racine.classList.add('reveler-actif');
  const observateur = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        entree.target.classList.add('est-revele');
        observateur.unobserve(entree.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const el of aSurveiller) observateur.observe(el);
}
