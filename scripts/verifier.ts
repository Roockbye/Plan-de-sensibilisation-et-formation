/**
 * `npm run check:contenus` : valide la configuration et tous les contenus,
 * affiche les avertissements (contrastes corrigés…) et un aperçu des parcours.
 * Code de sortie ≠ 0 en cas d'erreur : utilisable en intégration continue.
 */
import { chargerConfig, cheminConfig, ErreurConfig } from '../src/lib/config.ts';
import { chargerContenus } from '../src/lib/contenus.ts';
import { calculerParcours } from '../src/lib/parcours.ts';
import { tr } from '../src/lib/texte.ts';

try {
  console.log(`Configuration : ${cheminConfig()}`);
  const { config, avertissements, theme } = chargerConfig();
  const contenus = chargerContenus(config);

  console.log(`✔ Organisation : ${config.organisation.nom}`);
  console.log(`✔ ${contenus.risques.length} risques, ${contenus.profils.length} profils actifs, ${contenus.modules.length} modules`);
  console.log(`✔ Couleurs retenues : primaire ${theme.clair.primaire}, secondaire ${theme.clair.secondaire}`);
  for (const a of avertissements) console.warn(`⚠ ${a}`);

  for (const profil of contenus.profils) {
    const p = calculerParcours(profil, contenus.modules.map((m) => m.meta), config);
    const etapes = p.etapes.map((e) => `${e.module.code}${e.categorie === 'obligatoire' ? '*' : ''}(${e.score})`).join(' → ');
    console.log(`  • ${tr(profil.libelle)} [${p.dureeTotaleMinutes} min] : ${etapes}`);
  }
  console.log('  (* = obligatoire ; entre parenthèses : score de priorité issu de l\'analyse de risques)');
} catch (e) {
  if (e instanceof ErreurConfig) {
    console.error(`✘ ${e.message}`);
    process.exit(1);
  }
  throw e;
}
