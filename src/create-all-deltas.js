/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
const path = require("path");
const fs = require("fs-extra");
const DeltaInstallerBuilder = require("./delta-installer-builder");
const createDelta = require("./delta-installer-builder/create-delta");
const {
  downloadFileIfNotExists,
  extract7zip,
  getDownloadURL,
  removeExt,
  delay,
  computeSHA256,
  fileNameFromUrl,
} = require("./utils");

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
}) => {
  fs.ensureDirSync(cacheDir);

  const dataDir = path.join(cacheDir, "./data");
  const deltaDir = path.join(cacheDir, "./deltas");

  fs.ensureDirSync(dataDir);
  fs.ensureDirSync(deltaDir);
  let allReleases = [];
  try {
    allReleases = await getPreviousReleases();
  } catch (e) {
    logger.error("Unable to fetch previous releases", e);
  }

  if (!allReleases.length) {
    return null;
  }

  // last 10 releases only
  allReleases = allReleases.slice(0, 10);

  const latestReleaseFile = artifactPaths.filter((d) => d.endsWith(".exe"))[0];

  console.log("latestReleaseFile", latestReleaseFile);

  const latestReleaseFileName = removeExt(fileNameFromUrl(latestReleaseFile));
  const latestVersion = process.env.npm_package_version;

  logger.log("Current release info ", {
    latestReleaseFile,
    latestVersion,
    latestReleaseFileName,
  });

  // const APP_GUID = "153f8ce0-b97a-575b-ba12-4ff8b1481894";
  // const deltaBuilder = new DeltaBuilder({ APP_GUID });

  const deltaInstallerBuilder = new DeltaInstallerBuilder({
    PRODUCT_NAME: productName,
    PROCESS_NAME: processName,
  });

  // download all the installers
  for (const downloadURL of allReleases) {
    const file = fileNameFromUrl(downloadURL);
    const filePath = path.join(dataDir, file);
    logger.log("Downloading file ", filePath, " from ", downloadURL);
    await downloadFileIfNotExists(downloadURL, filePath);
  }

  // extract the installers
  for (const downloadURL of allReleases) {
    const file = fileNameFromUrl(downloadURL);
    const extractedDir = path.join(dataDir, removeExt(file));
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(path.join(extractedDir, `${processName}.exe`))) {
      fs.ensureDirSync(extractedDir);
      fs.emptyDirSync(extractedDir);
      await extract7zip(filePath, extractedDir);
    }
  }

  const latestReleaseDir = path.join(dataDir, latestReleaseFileName);

  // extract the latest release

  await extract7zip(latestReleaseFile, latestReleaseDir);

  const outputDir = path.join(outDir, latestReleaseFileName);

  await fs.ensureDir(latestReleaseDir);
  await fs.ensureDir(outputDir);
  await fs.emptyDir(outputDir);

  // compute the delta between any two versions
  for (const downloadURL of allReleases) {
    const file = fileNameFromUrl(downloadURL);
    const oldAppName = removeExt(file);
    if (oldAppName !== latestReleaseFileName) {
      const deltaFileName = `${oldAppName}-to-${latestReleaseFileName}.delta`;
      const deltaFilePath = path.join(deltaDir, deltaFileName);
      console.log(`Creating delta for ${oldAppName}`);
      createDelta(
        path.join(dataDir, oldAppName),
        latestReleaseDir,
        deltaFilePath
      );
      console.log("Delta file created ", deltaFilePath);
    }
  }

  // create the installer and sign it
  for (const downloadURL of allReleases) {
    const file = fileNameFromUrl(downloadURL);
    const oldAppName = removeExt(file);
    if (oldAppName !== latestReleaseFileName) {
      const deltaFileName = `${oldAppName}-to-${latestReleaseFileName}.delta`;
      const deltaFilePath = path.join(deltaDir, deltaFileName);
      const installerFileName = `${oldAppName}-to-${latestReleaseFileName}-delta.exe`;
      const installerOutputPath = path.join(outputDir, installerFileName);
      console.log(`Creating delta installer for ${oldAppName}`);
      await deltaInstallerBuilder.build({
        installerOutputPath,
        deltaFilePath,
        deltaFileName,
        productIconPath,
      });
      sign(installerOutputPath);
    }
  }

  const installerFileNames = fs.readdirSync(outputDir);

  for (const installerName of installerFileNames) {
    const installerPath = path.join(outputDir, installerName);
    console.log("Compute the sha256 of the installer ", installerPath);
    const sha256 = computeSHA256(installerPath);
    console.log("Computed sha256 ", sha256);
    fs.writeFileSync(path.join(`${installerPath}.sha256`), sha256);
  }

  return fs
    .readdirSync(outputDir)
    .map((fileName) => path.join(outputDir, fileName));
};

module.exports = createAllDeltas;
