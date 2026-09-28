/**
 * Serveur statique local qui applique les en-têtes de dist/_headers (comme Cloudflare Pages).
 * Sert aux tests de bout en bout : la CSP réellement déployée est vérifiée.
 * Usage : node scripts/serveur.ts [port]   (écoute uniquement sur 127.0.0.1)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

const RACINE = resolve(process.cwd(), 'dist');
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4321);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.vtt': 'text/vtt; charset=utf-8',
  '.ics': 'text/calendar; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

/** Lit les en-têtes du bloc « /* » du fichier _headers. */
function lireEntetes(): Record<string, string> {
  const fichier = join(RACINE, '_headers');
  if (!existsSync(fichier)) return {};
  const entetes: Record<string, string> = {};
  let dansBlocGlobal = false;
  for (const ligne of readFileSync(fichier, 'utf8').split('\n')) {
    if (!ligne.trim() || ligne.trim().startsWith('#')) continue;
    if (!/^\s/.test(ligne)) {
      dansBlocGlobal = ligne.trim() === '/*';
      continue;
    }
    if (dansBlocGlobal) {
      const i = ligne.indexOf(':');
      if (i > 0) entetes[ligne.slice(0, i).trim()] = ligne.slice(i + 1).trim();
    }
  }
  // HSTS et upgrade-insecure-requests n'ont pas de sens en HTTP local.
  delete entetes['Strict-Transport-Security'];
  if (entetes['Content-Security-Policy']) {
    entetes['Content-Security-Policy'] = entetes['Content-Security-Policy'].replace(/;\s*upgrade-insecure-requests/, '');
  }
  return entetes;
}

const ENTETES = lireEntetes();

async function resoudre(url: string): Promise<string | null> {
  let chemin: string;
  try {
    chemin = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  } catch {
    return null;
  }
  const absolu = resolve(RACINE, '.' + chemin);
  // Protection contre la traversée de répertoires.
  if (absolu !== RACINE && !absolu.startsWith(RACINE + sep)) return null;
  for (const candidat of [absolu, join(absolu, 'index.html')]) {
    try {
      if ((await stat(candidat)).isFile()) return candidat;
    } catch {
      /* essai suivant */
    }
  }
  return null;
}

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  const fichier = await resoudre(req.url ?? '/');
  const cible = fichier ?? join(RACINE, '404.html');
  const statut = fichier ? 200 : 404;
  try {
    const corps = await readFile(cible);
    const type = TYPES[extname(cible)] ?? 'application/octet-stream';
    // Requêtes partielles (Range) : nécessaires à la lecture et à la navigation dans les médias.
    const plage = fichier ? /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '') : null;
    if (plage && (plage[1] || plage[2])) {
      const debut = plage[1] ? Number(plage[1]) : Math.max(0, corps.length - Number(plage[2]));
      const fin = plage[1] && plage[2] ? Math.min(Number(plage[2]), corps.length - 1) : corps.length - 1;
      if (debut > fin || debut >= corps.length) {
        res.writeHead(416, { ...ENTETES, 'Content-Range': `bytes */${corps.length}` }).end();
        return;
      }
      res.writeHead(206, { ...ENTETES, 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${debut}-${fin}/${corps.length}`, 'Content-Length': fin - debut + 1 });
      res.end(req.method === 'HEAD' ? undefined : corps.subarray(debut, fin + 1));
      return;
    }
    res.writeHead(statut, { ...ENTETES, 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': corps.length });
    res.end(req.method === 'HEAD' ? undefined : corps);
  } catch {
    res.writeHead(404, ENTETES).end('Introuvable');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Site servi sur http://127.0.0.1:${PORT} (en-têtes de sécurité appliqués)`);
});
