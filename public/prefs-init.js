// Applique les préférences d'affichage AVANT le premier rendu (évite un flash de mise en page).
// Script externe et minimal : compatible avec une CSP sans 'unsafe-inline'.
(function () {
  var racine = document.documentElement;
  try {
    var prefs = JSON.parse(localStorage.getItem('ssi:preferences') || '{}');
    var autorisees = {
      taille: ['100', '125', '150', '200'],
      police: ['standard', 'hyperlegible', 'dyslexie'],
      theme: ['auto', 'clair', 'sombre', 'contraste'],
      espacement: ['normal', 'augmente'],
      animations: ['auto', 'reduites'],
      version: ['standard', 'falc'],
    };
    for (var cle in autorisees) {
      if (autorisees[cle].indexOf(prefs[cle]) !== -1) racine.setAttribute('data-' + cle, prefs[cle]);
    }
  } catch (e) {
    /* stockage indisponible : réglages par défaut */
  }
  racine.classList.add('js');
})();
