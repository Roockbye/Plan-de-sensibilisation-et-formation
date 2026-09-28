import { describe, expect, it } from 'vitest';
import { validerConfig } from '../../src/lib/config.ts';
import { chargerContenus } from '../../src/lib/contenus.ts';
import { calculerParcours } from '../../src/lib/parcours.ts';
import { exporterIcs, genererCalendrier } from '../../src/lib/calendrier.ts';
import { genererTableauDeBord } from '../../src/lib/indicateurs.ts';
import { configExemple } from './aides.ts';

function preparer(modifier?: (c: ReturnType<typeof configExemple>) => void) {
  const brute = configExemple();
  modifier?.(brute);
  const { config } = validerConfig(brute);
  const contenus = chargerContenus(config);
  const metas = contenus.modules.map((m) => m.meta);
  const calendrier = genererCalendrier(config, metas);
  const parcours = contenus.profils.map((p) => calculerParcours(p, metas, config));
  return { config, calendrier, parcours };
}

describe('calendrier annuel', () => {
  it('respecte la fréquence des simulations configurée', () => {
    const trimestre = preparer().calendrier.filter((a) => a.type === 'simulation');
    const mensuel = preparer((c) => (c.campagnes.simulationPhishing = 'mensuelle')).calendrier.filter((a) => a.type === 'simulation');
    expect(trimestre).toHaveLength(4);
    expect(mensuel).toHaveLength(11);
  });

  it('reste dans une fenêtre de 12 mois, trié, sur des jours ouvrés', () => {
    const { calendrier, config } = preparer();
    const debut = Date.parse(config.campagnes.debut);
    for (const a of calendrier) {
      const d = Date.parse(a.date);
      expect(d).toBeGreaterThanOrEqual(debut);
      expect(d - debut).toBeLessThan(366 * 86400000);
      expect([0, 6]).not.toContain(new Date(d).getUTCDay());
    }
    expect([...calendrier].sort((a, b) => a.date.localeCompare(b.date))).toEqual(calendrier);
  });

  it('programme chaque module au moins une fois dans les rappels', () => {
    const { calendrier, parcours } = preparer();
    const rappeles = new Set(calendrier.filter((a) => a.type === 'rappel').flatMap((a) => a.modules));
    for (const id of new Set(parcours.flatMap((p) => p.etapes.map((e) => e.module.id)))) expect(rappeles).toContain(id);
  });

  it('exporte un fichier iCalendar valide', () => {
    const { calendrier } = preparer();
    const ics = exporterIcs(calendrier, 'Org; test, "x"', '2027-01-01T00:00:00');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(calendrier.length);
    expect(ics).toContain('Org\\; test\\, "x"');
    for (const ligne of ics.split('\r\n')) expect(new TextEncoder().encode(ligne).length).toBeLessThanOrEqual(75);
  });
});

describe('tableau de bord fictif', () => {
  it('est déterministe pour une même graine', () => {
    const a = preparer();
    const b = preparer();
    expect(genererTableauDeBord(a.config, a.parcours, a.calendrier)).toEqual(genererTableauDeBord(b.config, b.parcours, b.calendrier));
  });

  it("respecte l'effectif et des pourcentages cohérents", () => {
    const { config, parcours, calendrier } = preparer();
    const tdb = genererTableauDeBord(config, parcours, calendrier);
    expect(Math.abs(tdb.effectifTotal - config.organisation.effectif)).toBeLessThanOrEqual(parcours.length);
    for (const p of tdb.parProfil) {
      expect(p.tauxCompletion).toBeGreaterThanOrEqual(0);
      expect(p.tauxCompletion).toBeLessThanOrEqual(100);
      expect(p.scorePostMoyen).toBeGreaterThanOrEqual(p.scorePreMoyen);
    }
    expect(tdb.simulations.length).toBeGreaterThan(0);
    expect(tdb.prochainesActions.every((a) => a.date > tdb.dateReference)).toBe(true);
  });
});
