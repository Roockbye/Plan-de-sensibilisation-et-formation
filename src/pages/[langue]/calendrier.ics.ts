import type { APIRoute } from 'astro';
import { donnees, languesPubliees } from '../../lib/donnees.ts';
import { exporterIcs } from '../../lib/calendrier.ts';
import type { Langue } from '../../lib/texte.ts';

export function getStaticPaths() {
  return languesPubliees().autres.map((langue) => ({ params: { langue } }));
}

export const GET: APIRoute = ({ params }) => {
  const d = donnees(params.langue as Langue);
  const ics = exporterIcs(d.calendrier, d.config.organisation.nom, `${d.config.campagnes.debut}T00:00:00`, d.langue);
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
