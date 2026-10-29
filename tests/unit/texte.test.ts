import { describe, expect, it } from 'vitest';
import { deNom, sansCoupure } from '../../src/lib/texte.ts';
import { t } from '../../src/i18n/index.ts';

describe('typographie française', () => {
  it('élide « de » devant un nom qui commence par une voyelle', () => {
    expect(deNom('AéroStar')).toBe("d'AéroStar");
    expect(deNom('Organisation exemple')).toBe("d'Organisation exemple");
    expect(deNom('Clinique des Tilleuls')).toBe('de Clinique des Tilleuls');
  });

  it('applique l\'élision dans les textes de l\'interface, en français seulement', () => {
    expect(t('accueil.programme', 'fr', { org: 'AéroStar' })).toBe("Programme de sensibilisation d'AéroStar");
    expect(t('accueil.programme', 'fr', { org: 'Clinique des Tilleuls' })).toBe('Programme de sensibilisation de Clinique des Tilleuls');
    expect(t('accueil.programme', 'en', { org: 'AéroStar' })).toBe('AéroStar awareness programme');
  });

  it('place une espace insécable avant « : » et empêche la coupure de « e-mail »', () => {
    expect(sansCoupure('I1 – Données : plans')).toBe('I1 – Données : plans');
    expect(sansCoupure('Les e-mails')).toBe('Les e-⁠mails');
  });
});
