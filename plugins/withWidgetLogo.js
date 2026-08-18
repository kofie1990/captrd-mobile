const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withWidgetLogo(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const svgPath = path.join(projectRoot, 'assets', 'logo.svg');
      
      if (!fs.existsSync(svgPath)) {
        console.warn(`[withWidgetLogo] Could not find ${svgPath}`);
        return config;
      }

      // The widget target created by expo-widgets is always 'ExpoWidgetsTarget'
      const targetName = 'ExpoWidgetsTarget';
      const assetCatalogPath = path.join(config.modRequest.platformProjectRoot, targetName, 'Assets.xcassets');
      
      // Ensure the asset catalog path exists (avoid race conditions with expo-widgets)
      fs.mkdirSync(assetCatalogPath, { recursive: true });
      
      // Create a symbolset for the SVG logo
      const symbolsetPath = path.join(assetCatalogPath, 'logo.symbolset');
      fs.mkdirSync(symbolsetPath, { recursive: true });
      
      // Copy the SVG
      fs.copyFileSync(svgPath, path.join(symbolsetPath, 'logo.svg'));
      
      // Write the Contents.json for Xcode to recognize it as a symbol
      fs.writeFileSync(path.join(symbolsetPath, 'Contents.json'), JSON.stringify({
        images: [
          {
            idiom: 'universal',
            filename: 'logo.svg'
          }
        ],
        info: { version: 1, author: 'xcode' }
      }, null, 2));
      return config;
    },
  ]);
};
