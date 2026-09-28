// Génère l'audio pédagogique du module M3 (voix de synthèse Piper, hors ligne) + sous-titres WebVTT.
// Mode d'emploi : docs/medias.md
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Mp3Encoder } from '@breezystack/lamejs';

const [, , sortieDir] = process.argv;
const TAUX = 22050;
const repliques = [
  ['narratrice', 'Narratrice', "Contenu pédagogique fictif. La voix que vous allez entendre a été générée par ordinateur, pour montrer à quel point une voix imitée peut sembler crédible."],
  ['directeur', 'Voix du « directeur »', "Bonjour, c'est Paul."],
  ['directeur', 'Voix du « directeur »', "Je suis en rendez-vous, je ne peux pas être long."],
  ['directeur', 'Voix du « directeur »', "Nous finalisons le rachat d'une société. C'est strictement confidentiel."],
  ['directeur', 'Voix du « directeur »', "Il faut faire partir un acompte de quarante-huit mille euros avant seize heures, sinon l'opération tombe."],
  ['directeur', 'Voix du « directeur »', "Maître Durand va vous envoyer les coordonnées bancaires."],
  ['directeur', 'Voix du « directeur »', "Je compte sur vous. N'en parlez à personne pour l'instant."],
  ['narratrice', 'Narratrice', "Fin de l'appel. Autorité, urgence, confidentialité : que faites-vous ?"],
];
const VOIX = { narratrice: 'fr_FR-siwis-medium.onnx', directeur: 'fr_FR-tom-medium.onnx' };

function synthese(texte, voix) {
  execFileSync(process.env.PIPER ?? './piper/piper', ['--model', VOIX[voix], '--output_file', 'tmp.wav', '--length_scale', voix === 'directeur' ? '0.95' : '1.0'], { input: texte, stdio: ['pipe', 'ignore', 'ignore'] });
  const buf = readFileSync('tmp.wav');
  const taux = buf.readUInt32LE(24);
  let i = 12; // recherche du bloc « data »
  while (buf.toString('ascii', i, i + 4) !== 'data') i += 8 + buf.readUInt32LE(i + 4);
  const pcm = new Int16Array(buf.buffer.slice(buf.byteOffset + i + 8, buf.byteOffset + i + 8 + buf.readUInt32LE(i + 4)));
  if (taux === TAUX) return pcm;
  const f = taux / TAUX; // sous-échantillonnage par moyenne
  const out = new Int16Array(Math.floor(pcm.length / f));
  for (let k = 0; k < out.length; k++) {
    let s = 0;
    for (let j = 0; j < f; j++) s += pcm[k * f + j];
    out[k] = s / f;
  }
  return out;
}

const silence = (s) => new Int16Array(Math.round(s * TAUX));
const morceaux = [silence(0.3)];
let t = 0.3;
const repere = (s) => {
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  return `${h}:${m}:${(s % 60).toFixed(3).padStart(6, '0')}`;
};
const vtt = ['WEBVTT', ''];
repliques.forEach(([voix, locuteur, texte], n) => {
  const pcm = synthese(texte, voix);
  const duree = pcm.length / TAUX;
  vtt.push(String(n + 1), `${repere(t)} --> ${repere(t + duree)}`, `<v ${locuteur}>${texte}`, '');
  morceaux.push(pcm);
  t += duree;
  const pause = n === 0 || n === repliques.length - 2 ? 0.9 : 0.35;
  morceaux.push(silence(pause));
  t += pause;
});

const total = new Int16Array(morceaux.reduce((s, m) => s + m.length, 0));
let pos = 0;
for (const m of morceaux) { total.set(m, pos); pos += m.length; }

const enc = new Mp3Encoder(1, TAUX, 48);
const blocs = [];
for (let k = 0; k < total.length; k += 1152) blocs.push(enc.encodeBuffer(total.subarray(k, k + 1152)));
blocs.push(enc.flush());
mkdirSync(sortieDir, { recursive: true });
writeFileSync(`${sortieDir}/appel-directeur.mp3`, Buffer.concat(blocs.map((b) => Buffer.from(b))));
writeFileSync(`${sortieDir}/appel-directeur.fr.vtt`, vtt.join('\n'));
console.log(`durée totale : ${t.toFixed(1)} s`);
