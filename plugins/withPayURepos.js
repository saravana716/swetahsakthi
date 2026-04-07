const { 
  withProjectBuildGradle, 
  withAndroidManifest, 
  withSettingsGradle, 
  withAppBuildGradle, 
  withMainApplication 
} = require('@expo/config-plugins');

/**
 * Expo Config Plugin for PayU SDK Integration (MANUAL LINKING)
 * 1. Adds PhonePe Maven repository
 * 2. Adds tools:replace="android:theme"
 * 3. Manually links the payu-non-seam-less-react package
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
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    if (manifest.application && manifest.application[0]) {
      manifest.application[0].$['tools:replace'] = 'android:theme';
    }
    return config;
  });

  // 3. Settings.gradle: include project
  config = withSettingsGradle(config, (config) => {
    const inclusion = `
include ':payu-non-seam-less-react'
project(':payu-non-seam-less-react').projectDir = new File(rootProject.projectDir, '../node_modules/payu-non-seam-less-react/android')
`;
    if (!config.modResults.contents.includes(':payu-non-seam-less-react')) {
      config.modResults.contents += inclusion;
    }
    return config;
  });

  // 4. App Build.gradle: add dependency
  config = withAppBuildGradle(config, (config) => {
    const dependency = "\n    implementation project(':payu-non-seam-less-react')\n";
    if (!config.modResults.contents.includes("implementation project(':payu-non-seam-less-react')")) {
      const search = /dependencies\s*{/;
      config.modResults.contents = config.modResults.contents.replace(search, (match) => `${match}${dependency}`);
    }
    return config;
  });

  // 5. MainApplication: register package
  config = withMainApplication(config, (config) => {
    // Correctly insert import AFTER the package declaration
    const packageImport = "\nimport com.payubiz.PayUBizSdkPackage";
    const packageAdd = "add(PayUBizSdkPackage())";

    // 1. Ensure Import
    if (!config.modResults.contents.includes("import com.payubiz.PayUBizSdkPackage")) {
      config.modResults.contents = config.modResults.contents.replace(
        /(package\s+[\w.]+)/,
        `$1${packageImport}`
      );
    }

    // 2. Add to package list (most robust way)
    if (!config.modResults.contents.includes("PayUBizSdkPackage()")) {
      // Pattern A: Standard Expo apply block
      const applySearch = /(PackageList\(this\)\.packages\.apply\s*{)/;
      if (config.modResults.contents.match(applySearch)) {
        config.modResults.contents = config.modResults.contents.replace(
          applySearch,
          `$1\n      ${packageAdd}`
        );
      } 
      // Pattern B: No apply block, direct return
      else {
        const directSearch = /(override\s+fun\s+getPackages\(\):\s+List<ReactPackage>\s*=\s*PackageList\(this\)\.packages)/;
        if (config.modResults.contents.match(directSearch)) {
          config.modResults.contents = config.modResults.contents.replace(
            directSearch,
            "override fun getPackages(): List<ReactPackage> = PackageList(this).packages.toMutableList().apply { add(PayUBizSdkPackage()) }"
          );
        }
      }
    }
    return config;
  });

  return config;
};

function addPhonePeRepo(buildGradle) {
  const mirrors = `
        mavenCentral()
        google()
        maven { url "https://plugins.gradle.org/m2/" }
        maven { url "https://oss.sonatype.org/content/repositories/releases/" }
        maven { url "https://phonepe.mycloudrepo.io/public/repositories/phonepe-intentsdk-android" }`;
  
  // Look for allprojects { repositories { ... } }
  const searchPattern = /allprojects\s*{\s*repositories\s*{/;
  
  if (buildGradle.includes('https://phonepe.mycloudrepo.io/public/repositories/phonepe-intentsdk-android')) {
    return buildGradle;
  }

  return buildGradle.replace(searchPattern, (match) => `${match}${mirrors}`);
}
