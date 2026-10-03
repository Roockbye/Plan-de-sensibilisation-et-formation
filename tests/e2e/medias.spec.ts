import { test, expect } from '@playwright/test';
import { auditerAccessibilite } from './outils.ts';

test('audio M3 : fichier lisible, sous-titres synchronisés et transcription disponible', async ({ page }) => {
  await page.goto('/modules/fraude-president/#situation');
  const audio = page.locator('audio[data-audio-sous-titre]');
  await expect(audio).toHaveCount(1);
  await expect(audio.locator('track[kind="captions"]')).toHaveAttribute('src', /\.vtt$/);

  const duree = await audio.evaluate(
    (a: HTMLAudioElement) => new Promise<number>((ok) => (a.readyState >= 1 ? ok(a.duration) : a.addEventListener('loadedmetadata', () => ok(a.duration)))),
  );
  expect(duree).toBeGreaterThan(35);
  expect(duree).toBeLessThan(50);

  // Positionner la lecture sur une réplique : la zone de sous-titres affiche le texte et le locuteur.
  await audio.evaluate((a: HTMLAudioElement) => (a.currentTime = 10.5));
  const zone = page.locator('[data-zone-sous-titre]');
  await expect(zone).toBeVisible();
  await expect(zone).toContainText("Voix du « directeur » : Bonjour, c'est Paul.");

  // La transcription est accessible au clavier.
  const resume = page.locator('.media__transcription summary');
  await resume.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.media__transcription')).toHaveAttribute('open', '');
  await expect(page.locator('.media__transcription')).toContainText('quarante-huit mille euros');
  await auditerAccessibilite(page, 'module avec audio');
});
