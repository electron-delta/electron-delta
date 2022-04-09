const createAllDeltas = require("./create-all-deltas");

function checkIsValidConfiguarion(context) {
  console.log(context.platformToTargets.get("Platform"));

  
  // if (context.platformToTargets.get("Platform").name !== "windows") {
  //   logger.error("DeltaBuilder is currently only supported for Windows target");
  //   return false;
  // }

  if (!context.configuration.nsis.oneClick) {
    logger.error(
      "DeltaBuilder is currently only supported for one-click installers"
    );
    return false;
  }

  if (context.configuration.nsis.perMachine) {
    logger.error("perMachine must be false for delta builds");
    return false;
  }

  return true;
}

const DeltaBuilder = {
  build: async ({ context, options }) => {
    console.log(context);
    const outDir = context.outDir;
    const artifactPaths = context.artifactPaths;

    const logger = options.logger || console;
    const cacheDir = process.env.ELECTRON_DELTA_CACHE || options.cache;

    const getPreviousReleases = options.getPreviousReleases;
    const sign = options.sign;

    const productIconPath = options.productIconPath;
    const productName = options.productName;
    const processName = options.processName || productName;

    if (!checkIsValidConfiguarion(context)) {
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
    });

    return deltaInstallerFiles;
  },
};

module.exports = DeltaBuilder;
