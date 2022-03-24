/* eslint-disable no-nested-ternary */
const fs = require("fs-extra");
const path = require("path");
const envPaths = require("env-paths");
const { extract7zip } = require("../utils");

const { downloadFile, safeSpawn } = require("../utils");

const defaultOptions = {
  logger: console,
  nsisURL: "https://github.com/electron-delta/nsis.zip/raw/main/nsis.zip",
};

class DeltaBuilder {
  constructor(options) {
    this.options = {
      ...defaultOptions,
      ...options,
    };

    this.defines = {
      APP_GUID: this.options.APP_GUID,
    };
  }

  get logger() {
    return this.options.logger;
  }

  async getNSISPath() {
    const paths = envPaths("electron-delta-bins");
    const deltaBinsDir =
      process.platform === "win32"
        ? path.join(process.env.APPDATA, "electron-delta-bins")
        : paths.data;
    const nsisRootPath = path.join(deltaBinsDir, "nsis-3.0.5.0");
    const makeNSISPath = path.join(
      nsisRootPath,
      process.platform === "darwin"
        ? "mac"
        : process.platform === "win32"
        ? "Bin"
        : "linux",
      process.platform === "win32" ? "makensis.exe" : "makensis"
    );

    if (fs.existsSync(makeNSISPath)) {
      this.logger.log("Cache exists: ", makeNSISPath);
      return { makeNSISPath, nsisRootPath };
    }

    await fs.ensureDir(deltaBinsDir);

    this.logger.log("Start downloading from", this.options.nsisURL);

    const filePath = await downloadFile(
      this.options.nsisURL,
      path.join(deltaBinsDir, "nsis.zip")
    );

    this.logger.log("Downloaded ", filePath);
    await extract7zip(filePath, deltaBinsDir);
    return { makeNSISPath, nsisRootPath };
  }

  static getNSISScript() {
    return path.resolve(path.join(__dirname, "./nsis/installer.nsi"));
  }

  getNSISArgs() {
    const args = [];
    Object.keys(this.defines).forEach((key) => {
      const value = this.defines[key];
      args.push(`-D${key}=${value}`);
    });
    return args;
  }

  async executeNSIS() {
    const args = this.getNSISArgs();
    const { makeNSISPath, nsisRootPath } = await this.getNSISPath();
    args.push(this.installerNSIPath);

    this.logger.log("NSIS args ", args);
    try {
      this.logger.log("Compiling with makensis ", this.installerNSIPath);
      await safeSpawn(makeNSISPath, args, {
        stdio: "ignore",
        cwd: path.dirname(this.installerNSIPath),
        env: { ...process.env, NSISDIR: nsisRootPath },
      });
      return true;
    } catch (err) {
      this.logger.log(err);
      return false;
    }
  }

  async build({
    installerOutputPath,
    deltaFilePath,
    deltaFileName,
    newAppSize,
    newAppVersion,
  }) {
    this.installerNSIPath = DeltaBuilder.getNSISScript();

    this.defines.INSTALLER_OUTPUT_PATH = installerOutputPath;
    this.defines.DELTA_FILE_PATH = deltaFilePath;
    this.defines.DELTA_FILE_NAME = deltaFileName;
    this.defines.NEW_APP_SIZE = newAppSize || 67540;
    this.defines.NEW_APP_VERSION = newAppVersion;
    let created = false;
    try {
      created = await this.executeNSIS();
    } catch (err) {
      console.error(err);
    }
    if (!created) {
      return null;
    }

    this.logger.log("EXE created: ", installerOutputPath);
    return installerOutputPath;
  }
}

module.exports = DeltaBuilder;
