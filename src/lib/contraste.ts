/**
 * Calculs de contraste WCAG 2.2 (critère 1.4.3, niveau AA).
 * Sert à garantir que les couleurs d'une organisation ne rendent jamais un texte illisible.
 */

export const RATIO_AA_TEXTE = 4.5;

export type Rgb = [number, number, number];

export function hexVersRgb(hex: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Couleur invalide « ${hex} » : format #RRGGBB attendu`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbVersHex([r, g, b]: Rgb): string {
  return '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Luminance relative (définition WCAG). */
export function luminance(hex: string): number {
  const [r, g, b] = hexVersRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste entre deux couleurs, de 1 à 21. */
export function ratioContraste(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function melanger(a: Rgb, b: Rgb, t: number): Rgb {
  return [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as Rgb;
}

/**
 * Rapproche progressivement `couleur` du noir ou du blanc (le plus contrasté avec
 * chacun des `fonds`) jusqu'à atteindre `cible` avec TOUS les fonds.
 * Renvoie la couleur d'origine si elle convient déjà, sinon la couleur la plus proche qui convient,
 * ou null si aucune teinte ne satisfait tous les fonds à la fois.
 */
export function ajusterContraste(couleur: string, fonds: string[], cible = RATIO_AA_TEXTE): string | null {
  const ok = (c: string) => fonds.every((f) => ratioContraste(c, f) >= cible);
  if (ok(couleur)) return couleur.toUpperCase();
  const depart = hexVersRgb(couleur);
  // On retient la correction la plus légère, vers le noir ou vers le blanc.
  let meilleure: { pas: number; couleur: string } | null = null;
  for (const extreme of [[0, 0, 0], [255, 255, 255]] as Rgb[]) {
    for (let pas = 1; pas <= 100; pas++) {
      const candidate = rgbVersHex(melanger(depart, extreme, pas / 100));
      if (ok(candidate)) {
        if (!meilleure || pas < meilleure.pas) meilleure = { pas, couleur: candidate };
        break;
      }
    }
  }
  return meilleure?.couleur ?? null;
}
