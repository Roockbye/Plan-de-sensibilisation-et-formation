/**
 * `npm run captures` : régénère les captures d'écran du README (docs/captures/)
 * à partir du site construit. À relancer après avoir adapté la plateforme à une organisation.
 */
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const PORT = 4397;
const CAS: { nom: string; url: string; prefs?: Record<string, string>; largeur?: number; pleine?: boolean; action?: string }[] = [
  { nom: 'accueil', url: '/' },
  { nom: 'parcours-manager', url: '/profils/manager/' },
  { nom: 'simulation-hameconnage', url: '/modules/hameconnage/#situation', action: '[data-message] [data-decision="malveillant"]' },
  { nom: 'tableau-de-bord', url: '/tableau-de-bord/', pleine: true },
  { nom: 'calendrier', url: '/calendrier/' },
  { nom: 'preferences-contraste', url: '/preferences/', prefs: { theme: 'contraste', taille: '125' } },
  { nom: 'mobile-falc-dyslexie', url: '/modules/incident/facile/', prefs: { police: 'dyslexie' }, largeur: 390 },
];

mkdirSync('docs/captures', { recursive: true });
const serveur = spawn(process.execPath, ['scripts/serveur.ts', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  for (const c of CAS) {
    const contexte = await navigateur.newContext({ viewport: { width: c.largeur ?? 1280, height: 860 } });
    await contexte.addInitScript((p) => localStorage.setItem('ssi:preferences', JSON.stringify(p)), c.prefs ?? {});
    const page = await contexte.newPage();
    await page.goto(`http://127.0.0.1:${PORT}${c.url}`);
    if (c.action) await page.locator(c.action).first().click();
    await page.screenshot({ path: `docs/captures/${c.nom}.png`, fullPage: c.pleine ?? false });
    await contexte.close();
    console.log(`✔ docs/captures/${c.nom}.png`);
  }
} finally {
  await navigateur.close();
  serveur.kill();
}
