const path = require('path');

const DeltaInstallerBuilder = require('../src/delta-installer-builder');

const { extract7zip } = require('../src/utils');

const installerOutputPath = path.join(__dirname, './delta-installer.exe');

const PRODUCT_NAME = 'electron-sample-app';
const PROCESS_NAME = 'electron-sample-app';

const createDelta = require('../src/delta-installer-builder/create-delta');

const latestEXEPath = path.resolve(
  'D:\\Work\\electron-delta\\electron-sample-app\\dist\\electron-sample-app-1.0.0.exe',
);

const oldEXEPath = path.resolve(
  'D:\\Work\\electron-delta\\electron-sample-app\\dist\\electron-sample-app-1.0.1.exe',
);

(async () => {
  const oldDir = path.join(__dirname, 'old');
  const latestDir = path.join(__dirname, 'latest');
  const deltaFilePath = path.join(__dirname, `${PRODUCT_NAME}.delta`);

  await extract7zip(latestEXEPath, latestDir);
  await extract7zip(oldEXEPath, oldDir);

  await createDelta(oldDir, latestDir, deltaFilePath);

  const deltaBuilder = new DeltaInstallerBuilder({
    PRODUCT_NAME,
    PROCESS_NAME,
  });

  try {
    await deltaBuilder.build({
      installerOutputPath,
      deltaFilePath,
      deltaFileName: `${PRODUCT_NAME}.delta`,
      productIconPath: path.resolve(__dirname, 'appIcon.ico'),
    });
  } catch (e) {
    console.log(e);
  }
})();
