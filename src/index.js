/* eslint-disable no-restricted-syntax */
/* eslint-disable global-require */
const path = require('path');
const createAllDeltas = require('./create-all-deltas');
const {
  removeExt,
  fileNameFromUrl,
} = require('./utils');

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

const getLatestReleaseInfo = ({ artifactPaths, platform = 'win', latestVersion }) => {
  const latestReleaseFilePath = artifactPaths.filter((d) => d.endsWith(platform === 'win' ? '.exe' : '.zip'))[0];

  const latestReleaseFileName = removeExt(fileNameFromUrl(latestReleaseFilePath));

  return { latestReleaseFilePath, latestReleaseFileName, latestVersion };
};

const DeltaBuilder = {
  build: async ({ context, options }) => {
    const { outDir } = context;
    const { artifactPaths } = context;

    const logger = options.logger || console;
    const { sign } = options;
    const { productIconPath } = options;
    const { productName } = options;
    const processName = options.processName || productName;
    const cacheDir = process.env.ELECTRON_DELTA_CACHE
      || options.cache
      || path.join(require('os').homedir(), '.electron-delta');

    if (!checkIsValidConfiguarion(context, logger)) {
      return [];
    }

    const buildFiles = [];

    for await (const platform of context.platformToTargets.keys()) {
      if (platform.buildConfigurationKey === 'win') {
        const {
          latestReleaseFilePath,
          latestReleaseFileName,
          latestVersion,
        } = getLatestReleaseInfo({
          artifactPaths,
          platform: 'win',
          latestVersion: process.env.npm_package_version,
        });

        const deltaInstallerFilesWin = await createAllDeltas({
          platform: 'win',
          outDir,
          logger,
          cacheDir,
          getPreviousReleases: options.getWindowsPreviousReleases,
          sign,
          productIconPath,
          productName,
          processName,
          latestReleaseFilePath,
          latestReleaseFileName,
          latestVersion,
        });
        if (deltaInstallerFilesWin && deltaInstallerFilesWin.length) {
          buildFiles.push(...deltaInstallerFilesWin);
        }
      }

      if (platform.buildConfigurationKey === 'mac') {
        const {
          latestReleaseFilePath,
          latestReleaseFileName,
          latestVersion,
        } = getLatestReleaseInfo({
          artifactPaths,
          platform: 'mac',
          latestVersion: process.env.npm_package_version,
        });
        const deltaInstallerFilesMac = await createAllDeltas({
          platform: 'mac',
          outDir,
          logger,
          cacheDir,
          getPreviousReleases: options.getMacPreviousReleases,
          sign,
          productIconPath,
          productName,
          processName,
          latestReleaseFilePath,
          latestReleaseFileName,
          latestVersion,
        });
        if (deltaInstallerFilesMac && deltaInstallerFilesMac.length) {
          buildFiles.push(...deltaInstallerFilesMac);
        }
      }
    }

    return buildFiles;
  },
};

module.exports = DeltaBuilder;
