const path = require('path');
const createAllDeltas = require('./create-all-deltas');

const DeltaBuilder = {
  build: async ({ context, options }) => {
    const { outDir } = context;
    const { artifactPaths } = context;

    const logger = options.logger || console;
    const cacheDir = process.env.ELECTRON_DELTA_CACHE
      || options.cache
      || path.join(require('os').homedir(), '.electron-delta');

    const { getPreviousReleases } = options;
    const { sign } = options;

    const { productIconPath } = options;
    const { productName } = options;
    const processName = options.processName || productName;
    const latestVersion = options.latestVersion || process.env.npm_package_version;

    const deltaInstallerFiles = await createAllDeltas({
      outDir,
      artifactPaths,
      logger,
      cacheDir,
      getPreviousReleases,
      sign,
      productIconPath,
      productName,
      processName,
      latestVersion,
    });

    return deltaInstallerFiles;
  },
};

module.exports = DeltaBuilder;
