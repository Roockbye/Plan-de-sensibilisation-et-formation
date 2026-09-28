import type { APIRoute } from 'astro';
import { donnees, languesPubliees } from '../lib/donnees.ts';
import { exporterIcs } from '../lib/calendrier.ts';

export const GET: APIRoute = () => {
  const d = donnees(languesPubliees().defaut);
  // Horodatage stable (début de campagne) : le fichier ne change que si la configuration change.
  const ics = exporterIcs(d.calendrier, d.config.organisation.nom, `${d.config.campagnes.debut}T00:00:00`, d.langue);
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
