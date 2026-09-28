import { test, expect } from '@playwright/test';
import { toutesLesPages } from './outils.ts';

test('les en-têtes de sécurité sont présents', async ({ request }) => {
  const reponse = await request.get('/');
  const h = reponse.headers();
  expect(h['content-security-policy']).toContain("script-src 'self'");
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['content-security-policy']).not.toContain('unsafe-inline');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['permissions-policy']).toContain('camera=()');
});

test('aucune page ne viole la CSP ni ne produit d\'erreur JavaScript', async ({ page }) => {
  const problemes: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || /Content Security Policy/i.test(m.text())) problemes.push(`${page.url()} : ${m.text()}`);
  });
  page.on('pageerror', (e) => problemes.push(`${page.url()} : ${e.message}`));
  for (const chemin of toutesLesPages()) await page.goto(chemin);
  expect(problemes).toEqual([]);
});

test('aucune ressource externe n\'est chargée', async ({ page, baseURL }) => {
  const externes: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(baseURL!)) externes.push(r.url());
  });
  for (const chemin of ['/', '/modules/hameconnage/', '/tableau-de-bord/', '/preferences/']) await page.goto(chemin);
  expect(externes).toEqual([]);
});

test('le serveur refuse la traversée de répertoires', async ({ request }) => {
  const r = await request.get('/..%2f..%2fpackage.json');
  expect(r.status()).toBe(404);
});

test('les liens de la simulation d\'hameçonnage ne sont jamais cliquables', async ({ page }) => {
  await page.goto('/modules/hameconnage/');
  const liensDansMessages = page.locator('[data-message] a');
  await expect(liensDansMessages).toHaveCount(0);
});
