/**
 * `npm run audit` : audit des dépendances avec gestion d'exceptions DOCUMENTÉES ET DATÉES.
 * - Échoue sur toute vulnérabilité haute ou critique, sauf si elle figure dans
 *   securite/exceptions-audit.json avec une justification et une date d'expiration non dépassée.
 * - Une exception expirée fait de nouveau échouer l'audit : le risque doit être réévalué.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

interface Exception { id: string; paquet: string; justification: string; expiration: string }
interface Via { source?: number; name?: string; url?: string; severity?: string; title?: string }

const GRAVES = new Set(['high', 'critical']);
const aujourdhui = new Date().toISOString().slice(0, 10);
const exceptions: Exception[] = JSON.parse(readFileSync('securite/exceptions-audit.json', 'utf8'));

let rapport: { vulnerabilities?: Record<string, { severity: string; via: (Via | string)[] }> };
try {
  rapport = JSON.parse(execFileSync('npm', ['audit', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
} catch (e) {
  // npm audit renvoie un code non nul dès qu'une vulnérabilité existe : le JSON est dans stdout.
  rapport = JSON.parse((e as { stdout: string }).stdout);
}

// Avis de sécurité (GHSA) de gravité haute ou critique, dédupliqués.
const avis = new Map<string, Via>();
for (const v of Object.values(rapport.vulnerabilities ?? {})) {
  for (const via of v.via) {
    if (typeof via === 'object' && via.url && GRAVES.has(via.severity ?? '')) {
      avis.set(via.url.split('/').pop()!, via);
    }
  }
}

let echec = false;
for (const [id, via] of avis) {
  const ex = exceptions.find((e) => e.id === id);
  if (!ex) {
    console.error(`✘ ${id} (${via.name}, ${via.severity}) : ${via.title} – aucune exception documentée.`);
    echec = true;
  } else if (ex.expiration < aujourdhui) {
    console.error(`✘ ${id} (${via.name}) : exception expirée le ${ex.expiration}, à réévaluer.`);
    echec = true;
  } else {
    console.warn(`⚠ ${id} (${via.name}) : risque accepté jusqu'au ${ex.expiration}. ${ex.justification}`);
  }
}
for (const ex of exceptions) {
  if (!avis.has(ex.id)) console.log(`ℹ L'exception ${ex.id} (${ex.paquet}) n'est plus nécessaire : vous pouvez la supprimer.`);
}
if (echec) process.exit(1);
console.log(`✔ Audit des dépendances : aucune vulnérabilité haute ou critique non traitée (${avis.size} exception(s) active(s)).`);
