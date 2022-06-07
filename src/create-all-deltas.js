/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
const path = require('path');
const fs = require('fs-extra');
const semverClean = require('semver/functions/clean');
const DeltaInstallerBuilder = require('./delta-installer-builder');
const createDelta = require('./delta-installer-builder/create-delta');
const {
  downloadFileIfNotExists,
  extract7zip,
  removeExt,
  computeSHA256,
  fileNameFromUrl,
} = require('./utils');

const preparePreviousReleases = (previousReleases) => previousReleases.map((release) => {
  const { url } = release;
  const version = semverClean(release.version);
  const fileName = fileNameFromUrl(url);
  return { url, version, fileName };
});

const createAllDeltas = async ({
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
}) => {
  fs.ensureDirSync(cacheDir);

  const dataDir = path.join(cacheDir, './data');
  const deltaDir = path.join(cacheDir, './deltas');

  fs.ensureDirSync(dataDir);
  fs.ensureDirSync(deltaDir);
  let allReleases = [];
  try {
    allReleases = await getPreviousReleases();
  } catch (e) {
    logger.error('Unable to fetch previous releases', e);
  }

  if (!allReleases.length) {
    logger.warn('No previous releases found');
    return null;
  }

  // last 10 releases only
  allReleases = allReleases.slice(0, 10);

  const latestReleaseFile = artifactPaths.filter((d) => d.endsWith('.exe'))[0];

  logger.debug('latestReleaseFile', latestReleaseFile);

  const latestReleaseFileName = removeExt(fileNameFromUrl(latestReleaseFile));

  logger.log('Current release info ', {
    latestReleaseFile,
    latestVersion,
    latestReleaseFileName,
  });

  const deltaInstallerBuilder = new DeltaInstallerBuilder({
    PRODUCT_NAME: productName,
    PROCESS_NAME: processName,
  });

  const previousReleases = preparePreviousReleases(allReleases);

  // download all the installers
  for (const { url, fileName } of previousReleases) {
    const filePath = path.join(dataDir, fileName);
    logger.log('Downloading file ', filePath, ' from ', url);
    await downloadFileIfNotExists(url, filePath);
  }

  // extract the installers
  for (const { fileName, version } of previousReleases) {
    const extractedDir = path.join(dataDir, version);
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(path.join(extractedDir, `${processName}.exe`))) {
      fs.ensureDirSync(extractedDir);
      fs.emptyDirSync(extractedDir);
      await extract7zip(filePath, extractedDir);
    }
  }

  const latestReleaseDir = path.join(dataDir, latestVersion);
  // extract the latest release

  await extract7zip(latestReleaseFile, latestReleaseDir);
  const outputDir = path.join(outDir, `${latestVersion}-delta-installers`);

  await fs.ensureDir(latestReleaseDir);
  await fs.ensureDir(outputDir);
  await fs.emptyDir(outputDir);

  // compute the delta between any two versions
  for (const { version } of previousReleases) {
    const deltaFileName = `${productName}-${version}-to-${latestVersion}.delta`;
    const deltaFilePath = path.join(deltaDir, deltaFileName);
    logger.log(`Creating delta for ${version}`);
    createDelta(
      path.join(dataDir, version),
      latestReleaseDir,
      deltaFilePath,
    );
    logger.log('Delta file created ', deltaFilePath);
  }

  const deltaJSON = {
    productName,
    latestVersion,
  };

  // create the installer and sign it
  for (const { version } of previousReleases) {
    const deltaFileName = `${productName}-${version}-to-${latestVersion}.delta`;
    const deltaFilePath = path.resolve(path.join(deltaDir, deltaFileName));
    const installerFileName = `${productName}-${version}-to-${latestVersion}-delta.exe`;
    const installerOutputPath = path.resolve(path.join(outputDir, installerFileName));
    console.log(`Creating delta installer for ${version}`);
    await deltaInstallerBuilder.build({
      installerOutputPath,
      deltaFilePath,
      deltaFileName,
      productIconPath,
    });
    sign(installerOutputPath);

    logger.log('Delta installer created ', installerOutputPath);
    deltaJSON[version] = { path: installerFileName };
  }

  for (const { version } of previousReleases) {
    const installerFileName = `${productName}-${version}-to-${latestVersion}-delta.exe`;
    const installerOutputPath = path.join(outputDir, installerFileName);
    console.log('Compute the sha256 of the installer ', installerOutputPath);
    const sha256 = computeSHA256(installerOutputPath);
    console.log('Computed sha256 ', sha256);
    deltaJSON[version] = { ...deltaJSON[version], sha256 };
  }

  const deltaJSONPath = path.join(outputDir, 'delta.json');
  fs.writeFileSync(deltaJSONPath, JSON.stringify(deltaJSON, null, 2));

  return fs
    .readdirSync(outputDir)
    .map((fileName) => path.join(outputDir, fileName));
};

module.exports = createAllDeltas;
