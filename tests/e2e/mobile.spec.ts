/** En-tête mobile : menu repliable accessible, préférences toujours visibles. */
import { test, expect } from '@playwright/test';
import { auditerAccessibilite } from './outils.ts';

test.use({ viewport: { width: 390, height: 844 } });

test('menu replié par défaut, ouvert au clavier, préférences toujours accessibles', async ({ page }) => {
  await page.goto('/modules/');
  const bouton = page.locator('[data-bouton-menu]');
  await expect(bouton).toBeVisible();
  await expect(bouton).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#menu-liste')).toBeHidden();
  await expect(page.locator('.lien-preferences')).toBeVisible();
  await auditerAccessibilite(page, 'mobile, menu replié');

  await bouton.focus();
  await page.keyboard.press('Enter');
  await expect(bouton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#menu-liste a[aria-current="page"]')).toBeVisible();
  await auditerAccessibilite(page, 'mobile, menu ouvert');
});

test('le lien d\'évitement « Aller au menu » déplie le menu', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText('Aller au menu');
  await page.keyboard.press('Enter');
  await expect(page.locator('#menu-liste')).toBeVisible();
});

test('le contenu commence dans le premier quart de l\'écran', async ({ page }) => {
  await page.goto('/modules/hameconnage/');
  const haut = await page.evaluate(() => document.querySelector('main')!.getBoundingClientRect().top);
  expect(haut).toBeLessThan(844 / 4);
});
