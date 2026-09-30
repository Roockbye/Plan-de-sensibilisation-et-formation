import { describe, expect, it } from 'vitest';
import fr from '../../src/i18n/fr.json' with { type: 'json' };
import en from '../../src/i18n/en.json' with { type: 'json' };
import { t } from '../../src/i18n/index.ts';

describe('dictionnaires de l\'interface', () => {
  it('la traduction anglaise couvre toutes les clés françaises', () => {
    expect(Object.keys(fr).filter((k) => !(k in en))).toEqual([]);
  });

  it('les paramètres {…} sont identiques dans chaque langue', () => {
    const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [cle, texte] of Object.entries(fr)) {
      expect(params((en as Record<string, string>)[cle] ?? texte), cle).toEqual(params(texte));
    }
  });

  it('remplace les paramètres et retombe sur le français', () => {
    expect(t('quiz.question', 'en', { n: 2, total: 5 })).toBe('Question 2 of 5');
    expect(t('quiz.question', 'fr', { n: 2, total: 5 })).toBe('Question 2 sur 5');
  });
});
