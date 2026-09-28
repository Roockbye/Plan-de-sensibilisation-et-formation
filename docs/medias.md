# Médias audio et vidéo

Tout média ajouté à un module doit être accompagné de :

1. **sous-titres** WebVTT (`.vtt`), dans `public/medias/<module>/` ;
2. une **transcription intégrale** (`transcription-….fr.md`), dans le dossier du module ;
3. une **mention** `mentionSynthetique` si la voix ou l'image sont générées par IA.

Le build échoue si les sous-titres ou la transcription manquent. Les navigateurs n'affichant pas les sous-titres d'un élément `<audio>`, la plateforme les affiche dans une zone synchronisée sous le lecteur.

## Régénérer l'audio du module M3 (appel du « directeur »)

L'enregistrement est produit **hors ligne** avec [Piper](https://github.com/rhasspy/piper), un moteur de synthèse vocale open source, et deux voix françaises (`fr_FR-siwis-medium` pour la narratrice, `fr_FR-tom-medium` pour le « directeur »). Aucun service en ligne ni aucune voix réelle ne sont utilisés.

```bash
mkdir /tmp/tts && cd /tmp/tts
curl -LO https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz && tar xzf piper_linux_x86_64.tar.gz
for v in siwis tom; do for e in onnx onnx.json; do
  curl -LO "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/$v/medium/fr_FR-$v-medium.$e"
done; done
npm init -y && npm install @breezystack/lamejs        # encodeur MP3 en JavaScript
cp <projet>/scripts/audio/generer-audio-m3.mjs .
node generer-audio-m3.mjs <projet>/public/medias/fraude-president
```

Le script synthétise chaque réplique séparément : les horodatages des sous-titres sont donc exacts. Pour modifier le texte, éditez le tableau `repliques` du script, puis la transcription `contenus/modules/fraude-president/transcription-appel.fr.md`.
