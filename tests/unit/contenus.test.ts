import { describe, expect, it } from 'vitest';
import { validerConfig } from '../../src/lib/config.ts';
import { chargerContenus } from '../../src/lib/contenus.ts';
import { markdownVersHtml, remplacer, variables } from '../../src/lib/personnalisation.ts';
import { configExemple } from './aides.ts';

describe('contenus pédagogiques', () => {
  const { config } = validerConfig(configExemple());
  const contenus = chargerContenus(config);

  it('charge les 8 modules du MVP avec leur version FALC et leurs quiz', () => {
    expect(contenus.modules).toHaveLength(8);
    for (const m of contenus.modules) {
      expect(m.falc.length, m.meta.id).toBeGreaterThan(100);
      expect(m.quiz.pretest.length).toBeGreaterThanOrEqual(2);
      expect(m.quiz.posttest.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('personnalise les contenus avec la configuration', () => {
    const m1 = contenus.modules.find((m) => m.meta.id === 'hameconnage')!;
    expect(m1.standard).toContain(config.contacts.securite);
    expect(m1.standard).not.toMatch(/\{\{/);
  });

  it('couvre au moins une menace émergente (nouvelles technologies)', () => {
    const emergents = contenus.risques.filter((r) => r.emergent).map((r) => r.id);
    expect(contenus.modules.some((m) => m.meta.risques.some((r) => emergents.includes(r)))).toBe(true);
  });

  it("n'active les modules sectoriels que sur demande de la configuration", () => {
    expect(contenus.modules.some((m) => m.meta.secteur === 'sante')).toBe(false);
    const c = configExemple();
    c.modulesSectoriels = ['sante'];
    const avecSante = chargerContenus(validerConfig(c).config);
    expect(avecSante.modules.find((m) => m.meta.id === 'secret-medical')?.meta.code).toBe('S1');
  });

  it('refuse un profil actif inexistant', () => {
    const c = configExemple();
    c.profilsActifs.push('astronaute');
    expect(() => chargerContenus(validerConfig(c).config)).toThrow(/astronaute/);
  });

  it('refuse un risque prioritaire absent du catalogue', () => {
    const c = configExemple();
    c.risquesPrioritaires.push({ id: 'meteorite', priorite: 1 });
    expect(() => chargerContenus(validerConfig(c).config)).toThrow(/meteorite/);
  });
});

describe('sécurité du rendu Markdown', () => {
  it('échappe le HTML brut', () => {
    const html = markdownVersHtml('Bonjour <script>alert(1)</script> <img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
  });

  it('neutralise les liens javascript:', () => {
    expect(markdownVersHtml('[clic](javascript:alert(1))')).not.toContain('javascript:');
  });

  it('refuse une variable de personnalisation inconnue', () => {
    const vars = variables(validerConfig(configExemple()).config);
    expect(() => remplacer('{{organisation.secret}}', vars)).toThrow(/inconnue/);
  });
});
