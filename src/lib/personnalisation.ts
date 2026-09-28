/**
 * Variables de personnalisation utilisables dans TOUS les contenus (Markdown et JSON) :
 *   {{organisation.nom}}, {{contacts.securite}}, {{contacts.signalement}}…
 * Les contenus restent génériques ; la configuration y injecte l'organisation.
 */
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
import type { Config } from './config.ts';
import { tr, type Langue } from './texte.ts';

const LIBELLES_SI: Record<Langue, Record<Config['organisation']['typeSI'], string>> = {
  fr: { cloud: 'principalement hébergé dans le cloud', 'sur-site': 'hébergé sur site', hybride: 'hybride (sur site et cloud)' },
  en: { cloud: 'mainly cloud-hosted', 'sur-site': 'hosted on premises', hybride: 'hybrid (on premises and cloud)' },
};
const ETAT_CONFORMITE: Record<Langue, Record<Config['accessibilite']['etatConformite'], string>> = {
  fr: { 'totalement conforme': 'totalement conforme', 'partiellement conforme': 'partiellement conforme', 'non conforme': 'non conforme' },
  en: { 'totalement conforme': 'fully compliant', 'partiellement conforme': 'partially compliant', 'non conforme': 'not compliant' },
};
export const LOCALES: Record<Langue, string> = { fr: 'fr-FR', en: 'en-GB' };

export function variables(config: Config, langue: Langue = 'fr'): Record<string, string> {
  const o = config.organisation;
  const dateAudit = config.accessibilite.dateAudit
    ? new Intl.DateTimeFormat(LOCALES[langue], { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${config.accessibilite.dateAudit}T00:00:00Z`))
    : undefined;
  return {
    'organisation.nom': o.nom,
    'organisation.nomCourt': o.nomCourt ?? o.nom,
    'organisation.effectif': String(o.effectif),
    'organisation.typeSI': LIBELLES_SI[langue][o.typeSI],
    // Domaine de messagerie, déduit de l'adresse du contact sécurité (sert aux mises en situation).
    'organisation.domaine': config.contacts.securite.split('@')[1],
    'contacts.securite': config.contacts.securite,
    'contacts.signalement': tr(config.contacts.signalement, langue),
    'contacts.telephoneUrgence': config.contacts.telephoneUrgence,
    'contacts.accessibilite': config.contacts.accessibilite,
    'evaluation.seuilReussite': String(config.evaluation.seuilReussite),
    'accessibilite.etatConformite': ETAT_CONFORMITE[langue][config.accessibilite.etatConformite],
    'accessibilite.dateAudit':
      langue === 'en'
        ? dateAudit ? `Last assessment: ${dateAudit}.` : 'No compliance assessment has been carried out yet.'
        : dateAudit ? `Dernière évaluation : ${dateAudit}.` : "Aucune évaluation de conformité n'a encore été réalisée.",
  };
}

const MOTIF = /\{\{\s*([a-zA-Z.]+)\s*\}\}/g;

/** Liste les variables inconnues d'un texte (utilisé par la validation des contenus). */
export function variablesInconnues(texte: string, vars: Record<string, string>): string[] {
  return [...texte.matchAll(MOTIF)].map((m) => m[1]).filter((nom) => !(nom in vars));
}

/** Remplace les variables. `echapper` adapte la valeur au format cible (JSON, Markdown…). */
export function remplacer(texte: string, vars: Record<string, string>, echapper: (v: string) => string = (v) => v): string {
  return texte.replace(MOTIF, (brut, nom: string) => {
    if (!(nom in vars)) throw new Error(`Variable inconnue ${brut}`);
    return echapper(vars[nom]);
  });
}

/** Échappe une valeur insérée dans une chaîne JSON. */
export const echapperJson = (v: string) => JSON.stringify(v).slice(1, -1);

/** Échappe les caractères qui ont un sens en Markdown. */
export const echapperMarkdown = (v: string) => v.replace(/([\\`*[\]<>#|])/g, '\\$1');

/**
 * Markdown → HTML. micromark est sûr par défaut : le HTML brut est échappé
 * et les URL dangereuses (javascript:, data:…) sont neutralisées.
 */
export function markdownVersHtml(markdown: string, decalageTitres = 0): string {
  let n = 0;
  const html = micromark(markdown, { extensions: [gfm()], htmlExtensions: [gfmHtml()] })
    // Tableaux larges : zone défilante atteignable au clavier (pas de défilement de toute la page).
    .replace(/<table>/g, () => `<div class="tableau-defilant" tabindex="0" role="region" aria-label="Tableau ${++n}"><table>`)
    .replace(/<\/table>/g, '</table></div>');
  if (!decalageTitres) return html;
  // Abaisse les niveaux de titres pour respecter la hiérarchie de la page (RGAA 9.1).
  return html.replace(/<(\/?)h([1-6])>/g, (_, fermeture: string, n: string) => `<${fermeture}h${Math.min(6, Number(n) + decalageTitres)}>`);
}

/** Markdown en ligne (sans paragraphe englobant) : pour les textes courts des JSON. */
export function markdownEnLigne(markdown: string): string {
  return markdownVersHtml(markdown).trim().replace(/^<p>([\s\S]*)<\/p>$/, '$1');
}
