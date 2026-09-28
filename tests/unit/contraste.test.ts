import { describe, expect, it } from 'vitest';
import { ajusterContraste, ratioContraste } from '../../src/lib/contraste.ts';

describe('contrastes WCAG', () => {
  it('calcule les ratios de référence', () => {
    expect(ratioContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(ratioContraste('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(ratioContraste('#767676', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('laisse inchangée une couleur déjà conforme', () => {
    expect(ajusterContraste('#1F4E79', ['#FFFFFF'])).toBe('#1F4E79');
  });

  it('corrige une couleur trop claire pour atteindre 4.5:1', () => {
    const corrigee = ajusterContraste('#FFD700', ['#FFFFFF', '#F3F4F6']);
    expect(corrigee).not.toBeNull();
    expect(ratioContraste(corrigee!, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(ratioContraste(corrigee!, '#F3F4F6')).toBeGreaterThanOrEqual(4.5);
  });

  it('éclaircit une couleur trop sombre pour un fond sombre', () => {
    const corrigee = ajusterContraste('#1F4E79', ['#15171A']);
    expect(ratioContraste(corrigee!, '#15171A')).toBeGreaterThanOrEqual(4.5);
  });

  it('rejette un format de couleur invalide', () => {
    expect(() => ratioContraste('rouge', '#FFFFFF')).toThrow(/#RRGGBB/);
  });
});
