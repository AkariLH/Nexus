const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Forzar la importación correcta de tslib
  if (moduleName === 'tslib') {
    return {
      filePath: require.resolve('tslib'),
      type: 'sourceFile',
    };
  }
  
  // Usar el resolver por defecto para otros módulos
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
