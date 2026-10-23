const { withAppBuildGradle } = require('expo/config-plugins');

// Windows: con -PcxxStagingDir=C:/bn los objetos C++ se generan en una ruta corta
// para no rebasar el límite de 260 caracteres de ninja (ver scripts/build-apk.bat).
// Como plugin, sobrevive a `expo prebuild`, que regenera android/app/build.gradle.
// Sin la propiedad no cambia nada, así que no afecta otras compilaciones.
const MARKER = 'cxxStagingDir';
const BLOCK = `
    if (findProperty('cxxStagingDir')) {
        externalNativeBuild {
            cmake {
                buildStagingDirectory file(findProperty('cxxStagingDir'))
            }
        }
    }`;

module.exports = function withCxxStagingDir(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    const { contents } = gradleConfig.modResults;
    if (!contents.includes(MARKER)) {
      gradleConfig.modResults.contents = contents.replace(/android\s*\{/, (match) => `${match}${BLOCK}`);
    }
    return gradleConfig;
  });
};
