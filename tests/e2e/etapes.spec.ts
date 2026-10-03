/** Module par étapes : une étape à la fois, reprise, états écrits, carte PARADE, repli sans JavaScript. */
import { test, expect } from '@playwright/test';
import { auditerAccessibilite } from './outils.ts';

test('une seule étape visible, état « En cours » et aria-current sur l\'étape active', async ({ page }) => {
  await page.goto('/modules/hameconnage/');
  await expect(page.locator('section.etape:not([hidden])')).toHaveCount(1);
  await expect(page.locator('#pretest')).toBeVisible();
  const lien = page.locator('a[data-lien-etape="pretest"]');
  await expect(lien).toHaveAttribute('aria-current', 'step');
  await expect(lien.locator('[data-etat-etape]')).toHaveText('En cours');
});

test('chaque étape passe l\'audit axe-core, ainsi que la carte parade gagnée', async ({ page }) => {
  for (const etape of ['essentiel', 'situation', 'posttest']) {
    await page.goto(`/modules/hameconnage/#${etape}`);
    await expect(page.locator(`#${etape}`)).toBeVisible();
    await auditerAccessibilite(page, `étape ${etape}`);
  }
  const qs = page.locator('#posttest fieldset');
  for (let i = 0; i < (await qs.count()); i++) {
    const q = qs.nth(i);
    for (const v of (await q.getAttribute('data-bonnes'))!.split(' ')) await q.locator(`input[value="${v}"]`).check();
  }
  await page.locator('#posttest [data-valider]').click();
  await expect(page.locator('[data-carte-parade]')).toHaveAttribute('data-etat', 'gagnee');
  await expect(page.locator('.carte-parade__face')).toBeVisible();
  await expect(page.locator('[data-annonce-parade]')).toContainText('Parades gagnées');
  await auditerAccessibilite(page, 'carte parade gagnée');
});

test('« Étape suivante » place le focus sur le titre et la reprise mène à la première étape non faite', async ({ page }) => {
  await page.goto('/modules/mots-de-passe/');
  await page.locator('#pretest a[rel="next"]').click();
  await expect(page).toHaveURL(/#essentiel$/);
  await expect(page.locator('#titre-essentiel')).toBeFocused();
  await expect(page.locator('a[data-lien-etape="pretest"] [data-etat-etape]')).toHaveText('À faire');
  await page.locator('#essentiel a[rel="next"]').click();
  // L'essentiel a été parcouru : en revenant sur le module, on reprend après lui.
  await page.goto('/modules/mots-de-passe/');
  await expect(page.locator('a[data-lien-etape="essentiel"] [data-etat-etape]')).toHaveText('Fait');
  await expect(page.locator('#pretest')).toBeVisible();
});

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('toutes les étapes restent lisibles et la liste des parades est visible', async ({ page }) => {
    await page.goto('/modules/hameconnage/');
    await expect(page.locator('section.etape:visible')).toHaveCount(4);
    await expect(page.locator('.carte-parade__face')).toBeVisible();
    await expect(page.locator('.carte-parade__dos')).toBeHidden();
  });
});

test('les réponses d\'un quiz en cours sont conservées en cas de rechargement', async ({ page }) => {
  await page.goto('/modules/hameconnage/#posttest');
  const choix = page.locator('#posttest input').first();
  await choix.check();
  await page.reload();
  await expect(page.locator('#posttest input').first()).toBeChecked();
});

test('la collection de « Ma progression » retourne les parades d\'un module validé', async ({ page }) => {
  await page.goto('/modules/incident/#posttest');
  const qs = page.locator('#posttest fieldset');
  for (let i = 0; i < (await qs.count()); i++) {
    const q = qs.nth(i);
    for (const v of (await q.getAttribute('data-bonnes'))!.split(' ')) await q.locator(`input[value="${v}"]`).check();
  }
  await page.locator('#posttest [data-valider]').click();
  await page.goto('/ma-progression/');
  await expect(page.locator('[data-collection-module="incident"] [data-carte-collection]')).toHaveAttribute('data-etat', 'gagnee');
  await expect(page.locator('[data-collection-compteur]')).toHaveText('3 parades gagnées sur 24');
  await auditerAccessibilite(page, 'collection de parades');
});
