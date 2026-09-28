/**
 * Feuille de thème générée à partir de la configuration (couleurs vérifiées WCAG AA).
 * Servie comme fichier statique /theme.css : aucun style inline dans les pages.
 */
import type { APIRoute } from 'astro';
import { plateforme } from '../lib/contenus.ts';

const COMMUNS = {
  clair: { attenue: '#4A4F56', bordure: '#6B7178', succes: '#1B6B32', erreur: '#B42318', avertissement: '#8A5300', focus: '#1A1C1E' },
  sombre: { attenue: '#C3C8CE', bordure: '#8E959C', succes: '#7BD99A', erreur: '#FF9F96', avertissement: '#F5C26B', focus: '#F1F3F5' },
};

export const GET: APIRoute = () => {
  const { theme } = plateforme();
  const bloc = (t: typeof theme.clair, c: typeof COMMUNS.clair) => `
  --fond: ${t.fond};
  --surface: ${t.surface};
  --texte: ${t.texte};
  --texte-attenue: ${c.attenue};
  --primaire: ${t.primaire};
  --secondaire: ${t.secondaire};
  --sur-primaire: ${t.surPrimaire};
  --bordure: ${c.bordure};
  --succes: ${c.succes};
  --erreur: ${c.erreur};
  --avertissement: ${c.avertissement};
  --focus: ${c.focus};`;

  const css = `/* Généré depuis la configuration de l'organisation – ne pas modifier à la main. */
:root, :root[data-theme="clair"] {${bloc(theme.clair, COMMUNS.clair)}
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]), :root[data-theme="auto"] {${bloc(theme.sombre, COMMUNS.sombre)}
    color-scheme: dark;
  }
}
:root[data-theme="sombre"] {${bloc(theme.sombre, COMMUNS.sombre)}
  color-scheme: dark;
}
:root[data-theme="contraste"] {
  --fond: #000000;
  --surface: #000000;
  --texte: #FFFFFF;
  --texte-attenue: #FFFFFF;
  --primaire: #FFFF00;
  --secondaire: #00FFFF;
  --sur-primaire: #000000;
  --bordure: #FFFFFF;
  --succes: #7CFF7C;
  --erreur: #FF8080;
  --avertissement: #FFFF00;
  --focus: #00FFFF;
  color-scheme: dark;
}
`;
  return new Response(css, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
};
