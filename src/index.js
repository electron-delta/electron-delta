/* eslint-disable no-restricted-syntax */
/* eslint-disable global-require */
const path = require('path');
const createAllDeltas = require('./create-all-deltas');
const {
  removeExt,
  fileNameFromUrl,
} = require('./utils');

const getLatestReleaseInfo = ({ artifactPaths, platform = 'win' }) => {
  const latestReleaseFilePath = artifactPaths.filter((d) => d.endsWith(platform === 'win' ? '.exe' : '.zip'))[0];

  const latestReleaseFileName = removeExt(fileNameFromUrl(latestReleaseFilePath));

  return { latestReleaseFilePath, latestReleaseFileName };
};

const DeltaBuilder = {
  build: async ({ context, options }) => {
    console.debug({ context }, { options });

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

    const latestVersion = options.latestVersion || process.env.npm_package_version;

    const buildFiles = [];

    for await (const platform of context.platformToTargets.keys()) {
      if (platform.buildConfigurationKey === 'win') {
        const {
          latestReleaseFilePath,
          latestReleaseFileName,
        } = getLatestReleaseInfo({
          artifactPaths,
          platform: 'win',
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
        } = getLatestReleaseInfo({
          artifactPaths,
          platform: 'mac',
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

    console.debug({ buildFiles });

    return buildFiles;
  },
};

module.exports = DeltaBuilder;
