import { describe, expect, it } from 'vitest';
import { validerConfig } from '../../src/lib/config.ts';
import { chargerContenus } from '../../src/lib/contenus.ts';
import { calculerParcours } from '../../src/lib/parcours.ts';
import { configExemple } from './aides.ts';

function parcoursPour(profilId: string, modifier?: (c: ReturnType<typeof configExemple>) => void) {
  const brute = configExemple();
  modifier?.(brute);
  const { config } = validerConfig(brute);
  const contenus = chargerContenus(config);
  const profil = contenus.profils.find((p) => p.id === profilId)!;
  return calculerParcours(profil, contenus.modules.map((m) => m.meta), config);
}

const codes = (p: ReturnType<typeof parcoursPour>) => p.etapes.map((e) => e.module.id);

describe('moteur de parcours', () => {
  it('place les modules obligatoires en premier', () => {
    const p = parcoursPour('utilisateur');
    const premiers = p.etapes.slice(0, 3).map((e) => e.categorie);
    expect(premiers.every((c) => c === 'obligatoire')).toBe(true);
    const idxPrioritaire = p.etapes.findIndex((e) => e.categorie !== 'obligatoire');
    expect(p.etapes.slice(idxPrioritaire).every((e) => e.categorie !== 'obligatoire')).toBe(true);
  });

  it("ne propose à un profil que les modules qui le concernent", () => {
    expect(codes(parcoursPour('utilisateur'))).not.toContain('hygiene-admin');
    expect(codes(parcoursPour('admin-it'))).toContain('hygiene-admin');
  });

  it("s'adapte quand les risques prioritaires de la configuration changent", () => {
    const avant = parcoursPour('utilisateur');
    const apres = parcoursPour('utilisateur', (c) => {
      c.risquesPrioritaires = [
        { id: 'ia-generative', priorite: 3 },
        { id: 'hameconnage', priorite: 1 },
      ];
    });
    const rangIA = (p: typeof avant) => codes(p).indexOf('ia-generative');
    expect(rangIA(apres)).toBeLessThan(rangIA(avant));
    // Sans risque prioritaire couvert, un module non obligatoire devient complémentaire.
    expect(apres.etapes.find((e) => e.module.id === 'nomadisme')?.categorie).toBe('complementaire');
  });

  it("double le poids d'un risque auquel le profil est exposé", () => {
    const p = parcoursPour('manager');
    const m3 = p.etapes.find((e) => e.module.id === 'fraude-president')!;
    const raison = m3.raisons.find((r) => r.risque === 'fraude-president')!;
    expect(raison.exposition).toBe(true);
    expect(raison.points).toBe(raison.priorite * 2);
  });

  it('signale les risques prioritaires non couverts par un parcours', () => {
    const p = parcoursPour('nouvel-arrivant');
    expect(p.risquesNonCouverts).toContain('privileges-admin');
  });
});
