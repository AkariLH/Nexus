const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Permite HTTP sin cifrar en la app compilada. El servidor de desarrollo corre en la red local
 * por http://; Android lo bloquea por defecto en compilaciones de release y la clave
 * `android.usesCleartextTraffic` de app.json no tiene efecto. Quitar este plugin cuando el
 * servidor tenga HTTPS.
 */
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (mod) => {
    mod.modResults.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    return mod;
  });
};
