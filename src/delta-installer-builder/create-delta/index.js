/* eslint-disable no-nested-ternary */
const path = require('path');
const { spawnSync } = require('child_process');

const hdiffz = path.join(
  __dirname,
  process.platform === 'darwin'
    ? 'macOS'
    : process.platform === 'win32'
      ? 'windows'
      : 'linux',
  process.platform === 'win32' ? 'hdiffz.exe' : 'hdiffz',
);

/**
 *
 * @param {string} oldDir The path to the old unpacked app
 * @param {string} newDir The path to the new unpacked app
 * @param {string} patchOut The expected of the created patch file
 */

const createDelta = (oldDir, newDir, patchOut) => {
  try {
    spawnSync(hdiffz, ['-f', '-c-lzma2', oldDir, newDir, patchOut], {
      stdio: 'inherit',
    });

    return true;
  } catch (err) {
    console.log('Compute hdiffz error ', err);
    return null;
  }
};

module.exports = createDelta;
