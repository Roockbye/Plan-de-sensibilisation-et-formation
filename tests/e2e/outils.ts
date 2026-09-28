import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Toutes les pages HTML produites par le build (hors 404). */
export function toutesLesPages(dossier = 'dist'): string[] {
  const pages: string[] = [];
  const parcourir = (d: string) => {
    for (const nom of readdirSync(d)) {
      const chemin = join(d, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (nom === 'index.html') pages.push('/' + relative(dossier, d).split('\\').join('/') + (d === dossier ? '' : '/'));
    }
  };
  parcourir(dossier);
  return pages.map((p) => p.replace(/^\/\/$/, '/')).sort();
}

/** Audit axe-core : WCAG 2.0, 2.1 et 2.2 niveaux A et AA (base du RGAA 4.1). */
export async function auditerAccessibilite(page: Page, contexte = '') {
  const resultats = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  const resume = resultats.violations.map(
    (v) => `[${v.impact}] ${v.id} : ${v.help}\n    ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n    ')}`,
  );
  expect(resume, `Violations d'accessibilité ${contexte}`).toEqual([]);
}

/** Enregistre des préférences d'affichage avant le chargement des pages. */
export async function definirPreferences(page: Page, prefs: Record<string, string>) {
  await page.addInitScript((p) => localStorage.setItem('ssi:preferences', JSON.stringify(p)), prefs);
}
