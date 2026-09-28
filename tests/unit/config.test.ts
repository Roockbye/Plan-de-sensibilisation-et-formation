import { describe, expect, it } from 'vitest';
import { validerConfig, ErreurConfig } from '../../src/lib/config.ts';
import { ratioContraste } from '../../src/lib/contraste.ts';
import { configExemple } from './aides.ts';

describe('validation de la configuration', () => {
  it('accepte la configuration par défaut', () => {
    const { config, avertissements } = validerConfig(configExemple());
    expect(config.organisation.nom).toBe('Organisation exemple');
    expect(avertissements).toEqual([]);
  });

  it('refuse une clé inconnue (faute de frappe)', () => {
    const c = configExemple();
    c.organisation.nomm = 'x';
    expect(() => validerConfig(c)).toThrow(/nomm/);
  });

  it('refuse une couleur mal formée', () => {
    const c = configExemple();
    c.charte.couleurPrimaire = 'bleu';
    expect(() => validerConfig(c)).toThrow(ErreurConfig);
  });

  it('refuse un logo pointant vers une URL externe', () => {
    const c = configExemple();
    c.organisation.logo = 'https://exemple.org/logo.svg';
    expect(() => validerConfig(c)).toThrow(/public\/organisation/);
  });

  it('refuse un e-mail de contact invalide', () => {
    const c = configExemple();
    c.contacts.securite = 'pas-un-email';
    expect(() => validerConfig(c)).toThrow(/contacts\.securite/);
  });

  it('refuse un risque prioritaire en double', () => {
    const c = configExemple();
    c.risquesPrioritaires.push({ id: 'hameconnage', priorite: 1 });
    expect(() => validerConfig(c)).toThrow(/double/);
  });

  it('corrige automatiquement une couleur peu contrastée et prévient', () => {
    const c = configExemple();
    c.charte.couleurPrimaire = '#7FB3E6';
    const { theme, avertissements } = validerConfig(c);
    expect(avertissements.join()).toMatch(/couleurPrimaire/);
    expect(ratioContraste(theme.clair.primaire, theme.clair.fond)).toBeGreaterThanOrEqual(4.5);
    expect(ratioContraste(theme.clair.primaire, theme.clair.surface)).toBeGreaterThanOrEqual(4.5);
    expect(ratioContraste(theme.sombre.primaire, theme.sombre.fond)).toBeGreaterThanOrEqual(4.5);
  });

  it('bloque une couleur peu contrastée si la correction automatique est désactivée', () => {
    const c = configExemple();
    c.charte.couleurSecondaire = '#FFB347';
    c.charte.correctionContrasteAuto = false;
    expect(() => validerConfig(c)).toThrow(/couleurSecondaire.*insuffisant/);
  });
});
