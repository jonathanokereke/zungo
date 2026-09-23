// Config plugin: pin the fmt pod to C++17 to fix FMT_STRING consteval errors on Xcode 16+.
// React Native's FuseboxTracer requires C++20 (uses unordered_map::contains),
// so we patch only the fmt target rather than setting a global standard.
const { withDangerousMod } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

const FMT_PATCH = `
    # Fix: fmt library FMT_STRING macro is incompatible with C++20 consteval on Xcode 16+.
    # Pin only the fmt pod to C++17; other RN pods need C++20 (unordered_map::contains).
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end
`

module.exports = function withFmtCpp17(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile')
      let contents = fs.readFileSync(podfilePath, 'utf8')

      // Only patch once
      if (!contents.includes("target.name == 'fmt'")) {
        // Insert before the closing 'end' of the post_install block
        contents = contents.replace(
          /(\s+end\s*\nend\s*$)/,
          `${FMT_PATCH}$1`
        )
        fs.writeFileSync(podfilePath, contents)
      }

      return config
    },
  ])
}
