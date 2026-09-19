const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

config.resolver.unstable_enableSymlinks = true

// pnpm stores packages in a content-addressable store accessed via symlinks.
// Without this, Metro resolves symlinks to their real paths and then can't
// find peer deps relative to the symlink location.
config.resolver.unstable_enablePackageExports = false

module.exports = config
