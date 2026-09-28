import { defineConfig } from 'astro/config';

// Site 100 % statique. Aucun script ni style inline n'est produit,
// ce qui permet une politique CSP stricte (script-src 'self'; style-src 'self').
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: {
    format: 'directory',
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Empêche l'intégration de scripts ou de ressources en ligne (data: / inline).
      assetsInlineLimit: 0,
    },
  },
});
