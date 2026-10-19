/**
 * Apparition au défilement des éléments [data-apparition].
 * Garde-fous d'accessibilité :
 * - rien n'est masqué si l'utilisateur réduit les animations (système ou préférences du site) ;
 * - un élément déjà visible au chargement n'est jamais masqué (pas de contenu « en attente ») ;
 * - si ce script ne s'exécute pas, tout reste visible (la classe qui active l'effet est posée ici).
 */
const racine = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches || racine.dataset.animations === 'reduites';
const elements = [...document.querySelectorAll<HTMLElement>('[data-apparition]')];

if (!reduit && elements.length && 'IntersectionObserver' in window) {
  const hauteur = window.innerHeight;
  const aSurveiller: HTMLElement[] = [];
  for (const el of elements) {
    if (el.getBoundingClientRect().top < hauteur) el.classList.add('est-revele');
    else aSurveiller.push(el);
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
