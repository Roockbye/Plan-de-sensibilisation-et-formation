import { test, expect } from '@playwright/test';
import { auditerAccessibilite, definirPreferences, toutesLesPages } from './outils.ts';

const PAGES = toutesLesPages();

test('le build contient toutes les pages attendues', () => {
  expect(PAGES).toContain('/');
  expect(PAGES).toContain('/tableau-de-bord/');
  expect(PAGES.filter((p) => p.endsWith('/facile/')).length).toBeGreaterThanOrEqual(8);
});

test.describe('audit axe-core de chaque page (thème clair)', () => {
  for (const chemin of PAGES) {
    test(chemin, async ({ page }) => {
      await page.goto(chemin);
      await auditerAccessibilite(page, chemin);
    });
  }
});

// Les préférences d'affichage ne doivent jamais dégrader l'accessibilité.
const VARIANTES: Record<string, Record<string, string>> = {
  sombre: { theme: 'sombre' },
  'contraste renforcé': { theme: 'contraste' },
  'texte 200 % + police dyslexie + espacement': { taille: '200', police: 'dyslexie', espacement: 'augmente' },
};
const PAGES_ECHANTILLON = ['/', '/modules/hameconnage/', '/modules/fraude-president/facile/', '/tableau-de-bord/', '/preferences/', '/profils/manager/'];

for (const [nom, prefs] of Object.entries(VARIANTES)) {
  test.describe(`audit avec préférences : ${nom}`, () => {
    for (const chemin of PAGES_ECHANTILLON) {
      test(chemin, async ({ page }) => {
        await definirPreferences(page, prefs);
        await page.goto(chemin);
        for (const [cle, valeur] of Object.entries(prefs)) {
          await expect(page.locator('html')).toHaveAttribute(`data-${cle}`, valeur);
        }
        await auditerAccessibilite(page, `${chemin} (${nom})`);
      });
    }
  });
}

test('aucun défilement horizontal de la page à 320 px de large (WCAG 1.4.10)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const chemin of ['/', '/modules/hameconnage/', '/tableau-de-bord/', '/calendrier/', '/plan/']) {
    await page.goto(chemin);
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(deborde, chemin).toBe(false);
  }
});

test('chaque page a un titre unique, une langue et un seul h1', async ({ page }) => {
  const titres = new Set<string>();
  for (const chemin of PAGES) {
    await page.goto(chemin);
    await expect(page.locator('html')).toHaveAttribute('lang', /^[a-z]{2}/);
    await expect(page.locator('h1'), chemin).toHaveCount(1);
    const titre = await page.title();
    expect(titres.has(titre), `titre en double : ${titre}`).toBe(false);
    titres.add(titre);
  }
});
