const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite en Web carga su motor mediante un módulo WebAssembly; Metro no lo
// reconoce como asset por defecto.
config.resolver.assetExts.push('wasm');

module.exports = config;
