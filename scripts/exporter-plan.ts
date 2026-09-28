/**
 * `npm run plan` : génère le « Plan de sensibilisation et de formation » de l'organisation active
 *   - exports/plan-sensibilisation-<organisation>.md (toujours) ;
 *   - exports/plan-sensibilisation-<organisation>.pdf (si le site est construit et Chromium disponible).
 * Changer d'organisation : ORGANISATION_CONFIG=config/autre.json npm run build && npm run plan
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { donnees } from '../src/lib/donnees.ts';
import { genererPlan } from '../src/lib/plan.ts';

const d = donnees();
const slug = (d.config.organisation.nomCourt ?? d.config.organisation.nom)
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dossier = resolve(process.cwd(), 'exports');
mkdirSync(dossier, { recursive: true });

const md = genererPlan(d, d.parcours, d.calendrier, new Date().toISOString().slice(0, 10));
const cheminMd = resolve(dossier, `plan-sensibilisation-${slug}.md`);
writeFileSync(cheminMd, md);
console.log(`✔ Markdown : ${cheminMd}`);

if (!existsSync(resolve(process.cwd(), 'dist/plan/index.html'))) {
  console.log('ℹ PDF non généré : lancez d\'abord « npm run build ».');
  process.exit(0);
}

const PORT = 4398;
const serveur = spawn(process.execPath, ['scripts/serveur.ts', String(PORT)], { stdio: 'ignore' });
try {
  const { chromium } = await import('@playwright/test');
  await new Promise((r) => setTimeout(r, 800));
  const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await navigateur.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/plan/`);
  const cheminPdf = resolve(dossier, `plan-sensibilisation-${slug}.pdf`);
  await page.pdf({
    path: cheminPdf,
    format: 'A4',
    margin: { top: '18mm', bottom: '18mm', left: '15mm', right: '15mm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:8pt;width:100%;text-align:center;">Plan de sensibilisation – ${d.config.organisation.nom.replace(/[<&]/g, '')} – page <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
  });
  await navigateur.close();
  console.log(`✔ PDF : ${cheminPdf}`);
} catch (e) {
  console.log(`ℹ PDF non généré (${(e as Error).message.split('\n')[0]}). Astuce : CHROMIUM_PATH=/usr/bin/chromium npm run plan`);
} finally {
  serveur.kill();
}
