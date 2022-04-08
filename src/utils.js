/* eslint-disable no-console */
const stream = require("stream");
const { promisify } = require("util");
const got = require("got");
const { spawnSync } = require("child_process");
const fs = require("fs-extra");
const crypto = require("crypto");
const sevenZip = require("7zip-min");

const pipeline = promisify(stream.pipeline);

function safeSpawn(exe, args, options) {
  return new Promise((resolve, reject) => {
    try {
      spawnSync(exe, args, options);
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
}

const downloadFile = async (url, filePath) => {
  console.log(`Downloading ${url}`);
  try {
    const downloadStream = got.stream(url);
    await pipeline(downloadStream, fs.createWriteStream(filePath));
    console.log(`Download completed ${filePath}`);
    return filePath;
  } catch (err) {
    throw new Error(err);
  }
};

const downloadFileIfNotExists = async (url, filePath) => {
  if (fs.existsSync(filePath)) {
    console.log("Cache exists: ", filePath);
    return filePath;
  }

  return downloadFile(url, filePath);
};

const extract7zip = (zipPath, extractedDir) =>
  new Promise((resolve, reject) => {
    console.log(`Extracting ${zipPath}`);
    console.log("Start extracting to ", extractedDir);
    sevenZip.unpack(zipPath, extractedDir, (err) => {
      if (err) {
        console.log(err);
        reject(new Error(err));
      } else {
        console.log("Extraction complete");
        resolve();
      }
    });
  });

const removeExt = (str) => str.replace(".exe", "");

const delay = (ms) =>
  new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });

const computeSHA256 = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const sum = crypto.createHash("sha256");
  sum.update(fileBuffer);
  const hex = sum.digest("hex");
  return hex;
};

function fileNameFromUrl(url) {
  var matches = url.match(/\/([^\/?#]+)[^\/]*$/);
  if (matches.length > 1) {
    return matches[1];
  }
  return null;
}

module.exports = {
  downloadFile,
  safeSpawn,
  downloadFileIfNotExists,
  extract7zip,
  removeExt,
  delay,
  computeSHA256,
  fileNameFromUrl,
};
