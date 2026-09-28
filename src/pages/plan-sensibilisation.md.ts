import type { APIRoute } from 'astro';
import { donnees } from '../lib/donnees.ts';
import { genererPlan } from '../lib/plan.ts';

export const GET: APIRoute = () => {
  const d = donnees();
  const md = genererPlan(d, d.parcours, d.calendrier, new Date().toISOString().slice(0, 10));
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
