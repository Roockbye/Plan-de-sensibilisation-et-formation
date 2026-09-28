import { test, expect } from '@playwright/test';

test('version anglaise : langue déclarée, liens hreflang et sélecteur de langue', async ({ page }) => {
  await page.goto('/en/modules/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', '/modules/');
  const versFrancais = page.locator('a.lien-langue[hreflang="fr"]');
  await expect(versFrancais).toHaveAttribute('lang', 'fr');
  await versFrancais.click();
  await expect(page).toHaveURL(/\/modules\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await page.locator('a.lien-langue[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/en\/modules\/$/);
});

test('module traduit (M1) : contenu, quiz et simulation en anglais', async ({ page }) => {
  await page.goto('/en/modules/hameconnage/');
  await expect(page.locator('h1')).toContainText('Phishing');
  await expect(page.locator('.encart--attention')).toHaveCount(0);
  await expect(page.locator('#pretest legend').first()).toContainText('Question 1 of 3');
  await expect(page.locator('[data-message]').first()).toContainText('Action required');
  await expect(page.locator('#essentiel [lang="fr"]')).toHaveCount(0);
});

test('module non traduit : avis affiché et contenu balisé lang="fr" (RGAA 8.7)', async ({ page }) => {
  await page.goto('/en/modules/incident/');
  await expect(page.locator('p.encart--attention').first()).toContainText('not been translated yet');
  await expect(page.locator('#essentiel > div[lang="fr"]')).toHaveCount(1);
  await expect(page.locator('#pretest form[lang="fr"]')).toHaveCount(1);
  // L'interface reste en anglais à l'intérieur du contenu français.
  await expect(page.locator('#pretest [data-valider]')).toHaveText('Submit my answers');
  await expect(page.locator('#pretest .groupe-boutons')).toHaveAttribute('lang', 'en');
});

test('la progression est partagée entre les langues', async ({ page }) => {
  await page.goto('/en/profils/manager/');
  await page.locator('[data-choisir-profil]').click();
  await expect(page.locator('[data-profil-confirmation]')).toHaveText('This profile is saved as yours.');
  await page.goto('/ma-progression/');
  await expect(page.locator('[data-profil-actuel]')).toContainText('Manager et direction');
});
