const { withProjectBuildGradle, withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for PayU SDK Integration
 * 1. Adds PhonePe Maven repository (Fixes missing IntentSDK)
 * 2. Adds tools:replace="android:theme" (Fixes Manifest Merger conflict)
 */
module.exports = (config) => {
  // 1. Add Repository
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addPhonePeRepo(config.modResults.contents);
    }
    return config;
  });

  // 2. Fix Manifest Merger
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure xmlns:tools is present
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Add tools:replace="android:theme" to the <application> tag
    if (manifest.application && manifest.application[0]) {
      manifest.application[0].$['tools:replace'] = 'android:theme';
    }

    return config;
  });

  return config;
};

function addPhonePeRepo(buildGradle) {
  const phonePeRepo = `
        maven { url "https://phonepe.mycloudrepo.io/public/repositories/phonepe-intentsdk-android" }`;
  
  // Look for allprojects { repositories { ... } }
  const searchPattern = /allprojects\s*{\s*repositories\s*{/;
  
  if (buildGradle.includes('https://phonepe.mycloudrepo.io/public/repositories/phonepe-intentsdk-android')) {
    return buildGradle;
  }

  return buildGradle.replace(searchPattern, (match) => `${match}${phonePeRepo}`);
}
