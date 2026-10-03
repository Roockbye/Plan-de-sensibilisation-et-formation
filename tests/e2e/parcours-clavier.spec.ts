/**
 * Parcours complets réalisés UNIQUEMENT au clavier, avec audit d'accessibilité
 * sur les états dynamiques (retours de quiz, étapes de scénario…).
 */
import { test, expect, type Page } from '@playwright/test';
import { auditerAccessibilite } from './outils.ts';

/** Appuie sur Tab jusqu'à ce que l'élément voulu ait le focus (échoue au-delà de `max`). */
async function tabulerJusqua(page: Page, selecteur: string, max = 200) {
  const cible = page.locator(selecteur).first();
  for (let i = 0; i < max; i++) {
    if (await cible.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Élément jamais atteint au clavier : ${selecteur}`);
}

test('le lien d\'évitement est le premier élément et mène au contenu', async ({ page }) => {
  await page.goto('/modules/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText('Aller au contenu');
  await expect(page.locator(':focus')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#contenu')).toBeFocused();
});

test('le focus est toujours visible', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const style = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { outline: cs.outlineStyle, largeur: parseFloat(cs.outlineWidth) };
    });
    expect(style.outline).not.toBe('none');
    expect(style.largeur).toBeGreaterThanOrEqual(2);
  }
});

test('quiz : erreurs listées, correction textuelle, module validé, progression enregistrée', async ({ page }) => {
  await page.goto('/modules/mots-de-passe/#posttest');
  const posttest = page.locator('#posttest form');

  // Valider sans répondre : la liste des questions manquantes reçoit le focus.
  await tabulerJusqua(page, '#posttest [data-valider]');
  await page.keyboard.press('Enter');
  const erreurs = posttest.locator('[data-erreurs]');
  await expect(erreurs).toBeFocused();
  await expect(erreurs.locator('li')).toHaveCount(4);

  // Répondre correctement à chaque question, au clavier.
  const questions = posttest.locator('fieldset');
  const n = await questions.count();
  for (let i = 0; i < n; i++) {
    const q = questions.nth(i);
    const bonnes = (await q.getAttribute('data-bonnes'))!.split(' ');
    for (const b of bonnes) {
      const input = q.locator(`input[value="${b}"]`);
      await input.focus();
      await page.keyboard.press('Space');
      await expect(input).toBeChecked();
    }
  }
  await posttest.locator('[data-valider]').focus();
  await page.keyboard.press('Enter');

  const resultat = posttest.locator('[data-resultat]');
  await expect(resultat).toBeFocused();
  await expect(resultat).toContainText('100 %');
  await expect(resultat).toContainText('Module validé');
  await expect(posttest.locator('[data-verdict]').first()).toHaveText('Bonne réponse.');
  await auditerAccessibilite(page, 'après correction du quiz');

  await page.goto('/ma-progression/');
  await expect(page.locator('[data-ligne-module="mots-de-passe"] [data-statut-module]')).toContainText('Validé');
});

test('simulation d\'hameçonnage : vérifier un lien et décider au clavier', async ({ page }) => {
  await page.goto('/modules/hameconnage/#situation');
  const premier = page.locator('[data-message]').first();

  await tabulerJusqua(page, '[data-message] [data-reveler]');
  await page.keyboard.press('Enter');
  await expect(premier.locator('[data-reveler]').first()).toHaveAttribute('aria-expanded', 'true');
  await expect(premier.locator('.message__destination').first()).toBeVisible();

  await premier.locator('[data-decision="malveillant"]').focus();
  await page.keyboard.press('Enter');
  const retour = premier.locator('[data-retour]');
  await expect(retour).toBeFocused();
  await expect(retour).toContainText('Bonne décision');
  await expect(page.locator('[data-compteur]')).toContainText('1 message(s) traité(s) sur 6');
  await auditerAccessibilite(page, 'après une décision dans la boîte mail');
});

test('mise en situation à embranchements : parcours complet au clavier', async ({ page }) => {
  await page.goto('/modules/incident/#situation');
  const scenario = page.locator('[data-scenario]');
  const etapesVisibles = scenario.locator('[data-etape]:not([hidden])');
  await expect(etapesVisibles).toHaveCount(1);

  // Tant qu'il reste des choix, prendre le premier choix « adapté » disponible.
  for (let tour = 0; tour < 10; tour++) {
    const etape = etapesVisibles.last();
    const choix = etape.locator('[data-choix][data-adapte="true"]:not([disabled])');
    if ((await choix.count()) === 0) break;
    await choix.first().focus();
    await page.keyboard.press('Enter');
    const continuer = etape.locator('[data-retour-pour]:not([hidden]) [data-continuer]');
    if ((await continuer.count()) === 0) break;
    await continuer.focus();
    await page.keyboard.press('Enter');
    await expect(etapesVisibles.last().locator('h3')).toBeFocused();
  }
  await expect(scenario.locator('[data-bilan]')).toBeVisible();
  await expect(scenario.locator('[data-bilan]')).toContainText('choix adaptés sur');
  await auditerAccessibilite(page, 'fin de mise en situation');
});

test('préférences : changement au clavier appliqué immédiatement et conservé', async ({ page }) => {
  await page.goto('/preferences/');
  await page.locator('#pref-theme-contraste').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'contraste');
  await expect(page.locator('[data-statut-prefs]')).toHaveText('Préférences enregistrées.');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'contraste');
});

test('préférence FALC : les liens des modules mènent à la version facile à lire', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ssi:preferences', JSON.stringify({ version: 'falc' })));
  await page.goto('/profils/utilisateur/');
  await expect(page.locator('a[data-lien-module="hameconnage"]').first()).toHaveAttribute('href', '/modules/hameconnage/facile/');
  await page.goto('/modules/hameconnage/');
  await expect(page.locator('.suggestion-falc')).toBeVisible();
});
