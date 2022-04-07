const path = require("path");

const DeltaBuilder = require("../src/delta-builder");

const { extract7zip } = require("../src/utils");

const installerOutputPath = path.join(__dirname, "linear-updater.exe");

const PRODUCT_NAME = "electron-quick-start";
const PROCESS_NAME = "electron-quick-start";

const createDelta = require("../src/delta-builder/create-delta");

const latestEXEPath = path.resolve(
  "D:\\Work\\electron-delta\\electron-quick-start\\dist\\electron-quick-start-0.0.3.exe"
);

const oldEXEPath = path.resolve(
  "D:\\Work\\electron-delta\\electron-quick-start\\dist\\electron-quick-start-0.0.2.exe"
);

(async () => {
  const oldDir = path.join(__dirname, "old");
  const latestDir = path.join(__dirname, "latest");
  const deltaFilePath = path.join(__dirname, `${PRODUCT_NAME}.delta`);

  await extract7zip(latestEXEPath, latestDir);
  await extract7zip(oldEXEPath, oldDir);

  await createDelta(oldDir, latestDir, deltaFilePath);

  const deltaBuilder = new DeltaBuilder({
    PRODUCT_NAME,
    PROCESS_NAME,
  });

  try {
    await deltaBuilder.build({
      installerOutputPath,
      deltaFilePath,
      deltaFileName: `${PRODUCT_NAME}.delta`,
      productIconPath: path.resolve(__dirname, "appIcon.ico"),
    });
  } catch (e) {
    console.log(e);
  }
})();
