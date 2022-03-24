const path = require('path');

const DeltaBuilder = require('../src/delta-builder');

const deltaFilePath = path.join(__dirname, 'diff.delta');
const installerOutputPath = path.join(__dirname, 'blitz-delta-updater.exe');

(async () => {
  const deltaBuilder = new DeltaBuilder({
    APP_GUID: '153f8ce0-b97a-575b-ba12-4ff8b1481894',
  });

  try {
    await deltaBuilder.build({
      installerOutputPath,
      deltaFilePath,
      newAppSize: 70000,
      newAppVersion: '1.15.11',
    });
  } catch (e) {
    console.log(e);
  }
})();
