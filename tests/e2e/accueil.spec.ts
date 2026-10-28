/** Accueil : choisir son profil, puis « Votre jeu » avec un seul bouton principal. */
import { test, expect } from '@playwright/test';
import { auditerAccessibilite } from './outils.ts';

test('choix du profil au clavier : « Votre jeu » s\'affiche avec le prochain module', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-mon-jeu]')).toBeHidden();
  const bouton = page.locator('[data-choisir="bureau-etudes"]');
  await bouton.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#titre-mon-jeu')).toBeFocused();
  await expect(page.locator('#titre-mon-jeu')).toContainText('Ingénieur et technicien de bureau d');
  await expect(page.locator('[data-jeu-compteur]')).toHaveText('0 parades gagnées sur 21');
  // Premier module du parcours bureau d'études : M1 (socle obligatoire, ordre pédagogique).
  await expect(page.locator('[data-jeu-prochain]')).toHaveAttribute('href', '/modules/hameconnage/');
  await expect(page.locator('[data-jeu-cartes] li')).toHaveCount(7);
  await auditerAccessibilite(page, 'accueil « Votre jeu »');

  // Le profil est mémorisé ; « Changer de profil » ramène au choix.
  await page.reload();
  await expect(page.locator('[data-mon-jeu]')).toBeVisible();
  await page.locator('[data-jeu-changer]').click();
  await expect(page.locator('#titre-qui')).toBeFocused();
});
