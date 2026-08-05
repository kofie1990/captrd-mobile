const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Limit workers to avoid EMFILE errors on Windows without Watchman
config.maxWorkers = 2;

// Fix for "Cannot destructure property '__extends' of 'tslib.default'" on Web
const ALIASES = {
  'tslib': path.resolve(__dirname, 'node_modules/tslib/tslib.es6.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (ALIASES[moduleName]) {
    return context.resolveRequest(context, ALIASES[moduleName], platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/global.css' });
