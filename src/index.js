/* eslint-disable no-restricted-syntax */
/* eslint-disable global-require */
const path = require('path');
const createAllDeltas = require('./create-all-deltas');
const {
  removeExt,
  fileNameFromUrl,
} = require('./utils');

const macOSBinaries = [
  path.join(__dirname, './mac-updater-binaries/hpatchz'),
  path.join(__dirname, './mac-updater-binaries/mac-updater'),
];

const windowsDone = false;
const macDone = false;

const getLatestReleaseInfo = ({ artifactPaths, platform, target }) => {
  const latestReleaseFilePath = artifactPaths.filter((d) => {
    if (platform === 'win' && target === 'nsis') {
      return d.endsWith('.exe');
    }
    if (platform === 'win' && target === 'nsis-web') {
      return d.endsWith('.7z');
    }
    if (platform === 'mac') {
      return d.endsWith('.zip');
    }
    return false;
  })[0];

  const latestReleaseFileName = removeExt(fileNameFromUrl(latestReleaseFilePath));

  return { latestReleaseFilePath, latestReleaseFileName };
};

const DeltaBuilder = {
  build: async ({ context, options }) => {
    console.log('Building deltas...');
    console.debug('context', context);
    console.debug('options', options);
    console.log('platformToTargets', context.platformToTargets);

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
    const { getPreviousReleases } = options;
    const buildFiles = [];

    for await (const platform of context.platformToTargets.keys()) {
      const platformName = platform.buildConfigurationKey;
      console.log('Building deltas for platform: ', platformName);

      if (platformName === 'win') {
        // create delta for windows
        const targets = context.platformToTargets.get(platform);
        const target = targets.entries().next().value[0];
        console.log('Only first target name is taken: ', target);
        const {
          latestReleaseFilePath,
          latestReleaseFileName,
        } = getLatestReleaseInfo({
          artifactPaths,
          platform: platformName,
          target,
        });
        const deltaInstallerFilesWindows = await createAllDeltas({
          platform: platformName,
          outDir,
          logger,
          cacheDir,
          target,
          getPreviousReleases,
          sign,
          productIconPath,
          productName,
          processName,
          latestReleaseFilePath,
          latestReleaseFileName,
          latestVersion,
        });
        if (deltaInstallerFilesWindows && deltaInstallerFilesWindows.length) {
          buildFiles.push(...deltaInstallerFilesWindows);
        }
      }

      if (platformName === 'mac') {
        // create delta for mac
        // for mac zip target is mandatory
        // hence no need to mention the target
        const {
          latestReleaseFilePath,
          latestReleaseFileName,
        } = getLatestReleaseInfo({
          artifactPaths,
          platform: platformName,
          target: 'zip',
        });
        const deltaInstallerFilesMac = await createAllDeltas({
          platform: platformName,
          outDir,
          logger,
          cacheDir,
          target: 'zip',
          getPreviousReleases,
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
        console.log('Adding Macos updater helper binaries ', deltaInstallerFilesMac);
        buildFiles.push(...macOSBinaries);
      }
    }
    console.debug('Created delta files', buildFiles);
    return buildFiles;
  },
};

module.exports = DeltaBuilder;
