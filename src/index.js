const path = require('path');
const createAllDeltas = require('./create-all-deltas');

function checkIsValidConfiguarion(context, logger) {
  if (!context.configuration.nsis.oneClick) {
    logger.error(
      'DeltaBuilder is currently only supported for one-click installers',
    );
    return false;
  }

  if (context.configuration.nsis.perMachine) {
    logger.error('perMachine must be false for delta builds');
    return false;
  }

  return true;
}

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

    if (!checkIsValidConfiguarion(context, logger)) {
      return;
    }

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
