/**
 * Éléments ajoutés pour les critères du référentiel : support de présentation accessible,
 * avis de fin de module (évaluation de niveau 1) et sections du plan exporté.
 */
import { test, expect } from '@playwright/test';
import { auditerAccessibilite } from './outils.ts';

const PRESENTATION = '/modules/hameconnage/presentation/';

test('support de présentation : une diapositive à la fois, pilotable au clavier', async ({ page }) => {
  await page.goto(PRESENTATION);
  const diapos = page.locator('[data-diapo]');
  const total = await diapos.count();
  expect(total).toBeGreaterThan(5);
  await expect(page.locator('[data-diapo]:visible')).toHaveCount(1);
  const compteur = page.locator('[data-compteur]');
  await expect(compteur).toHaveText(`Diapositive 1 sur ${total}`);

  await page.locator('[data-suivante]').focus();
  await page.keyboard.press('Enter');
  await expect(compteur).toHaveText(`Diapositive 2 sur ${total}`);

  await page.keyboard.press('ArrowRight');
  await expect(compteur).toHaveText(`Diapositive 3 sur ${total}`);
  await expect(page.locator('#diapo-3 h2')).toBeFocused();

  await page.keyboard.press('End');
  await expect(compteur).toHaveText(`Diapositive ${total} sur ${total}`);
  await expect(page.locator('[data-suivante]')).toBeDisabled();
  await page.keyboard.press('Home');
  await expect(compteur).toHaveText(`Diapositive 1 sur ${total}`);
  await auditerAccessibilite(page, 'support de présentation');

  // Mode « toutes les diapositives » : tout redevient visible.
  await page.locator('[data-mode]').click();
  await expect(page.locator('[data-diapo]:visible')).toHaveCount(total);
});

test('support de présentation : lien direct vers une diapositive, réponse révélée à la demande', async ({ page }) => {
  await page.goto(`${PRESENTATION}#diapo-8`);
  const diapo = page.locator('#diapo-8');
  await expect(diapo).toBeVisible();
  const reponse = diapo.locator('.diapo__reponse');
  await expect(reponse.locator('p').first()).toBeHidden();
  await reponse.locator('summary').click();
  await expect(reponse.locator('p').first()).toBeVisible();
});

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('toutes les diapositives se lisent à la suite', async ({ page }) => {
    await page.goto(PRESENTATION);
    const total = await page.locator('[data-diapo]').count();
    await expect(page.locator('[data-diapo]:visible')).toHaveCount(total);
    await expect(page.locator('[data-barre]')).toBeHidden();
  });
});

test('avis de fin de module : enregistré dans le navigateur et retrouvé', async ({ page }) => {
  await page.goto('/modules/hameconnage/#posttest');
  const avis = page.locator('[data-avis="hameconnage"]');
  await expect(avis).toBeVisible();
  const statut = avis.locator('[data-avis-statut]');

  await avis.locator('[data-avis-enregistrer]').click();
  await expect(statut).toHaveText('Répondez au moins à une question avant d\'enregistrer.');

  await avis.locator('#avis-hameconnage-adapte-oui').check();
  await avis.locator('#avis-hameconnage-utile-en-partie').check();
  await avis.locator('[data-avis-enregistrer]').click();
  await expect(statut).toHaveText('Merci, votre avis est enregistré dans ce navigateur.');
  await auditerAccessibilite(page, 'avis enregistré');

  await page.reload();
  await expect(page.locator('#avis-hameconnage-adapte-oui')).toBeChecked();
  await expect(page.locator('#avis-hameconnage-utile-en-partie')).toBeChecked();
});

test('le plan exporté couvre besoins, handicap, évaluation accessible et fréquences justifiées', async ({ request }) => {
  const plan = await (await request.get('/plan-sensibilisation.md')).text();
  for (const titre of [
    "### Méthode d'identification des besoins",
    '### Adaptation des moyens aux situations de handicap',
    '### Une évaluation accessible à toutes et tous',
    "### Adaptation à l'écosystème de l'organisation",
    '### Renouvellements déclenchés par un événement',
  ]) expect(plan).toContain(titre);
  for (const titre of ['## En bref', '### Effort de formation', "### Simulations d'hameçonnage : cadre de mise en œuvre"]) expect(plan).toContain(titre);
  expect(plan).toContain('Support de présentation pour séance collective');
  // Français soigné : élision devant le nom de l'organisation, niveaux accentués.
  expect(plan).not.toMatch(/\bde AéroStar\b/);
  expect(plan).not.toMatch(/\| decouverte \|/);
  expect(plan).toContain('| Action | Fréquence | Justification pour l\'organisation |');
});
