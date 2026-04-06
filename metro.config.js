const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// SDK 54+ Recommended Configuration for Firebase 12+
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'require', 'import'];

// EXCLUDE functions folder from Metro to avoid conflicts with backend node_modules
config.resolver.blockList = [
  /.*\/functions\/node_modules\/.*/,
];

config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs',
];

module.exports = config;
