const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 1. Enable modern package exports for Firebase v12+
config.resolver.unstable_enablePackageExports = true;

// 2. Add support for all necessary extensions including modular Firebase .mjs/.cjs
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs',
];

// 3. Fix resolution for libraries with broken "src" folder redirection in Metro
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react-native-svg/lib/commonjs/index.js'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'react-native-webview') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react-native-webview/lib/index.js'),
      type: 'sourceFile',
    };
  }
  
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
