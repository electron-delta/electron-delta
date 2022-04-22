# @electron-delta/builder

True delta updates for electronjs apps. It reduces the bandwidth usage by 90%. Users download only the delta. It uses binary diffing (`HDiffPatch` library) to generate the delta.

## Requirements

1. The app must use `electron-builder` to build the app.
2. Currently only `Windows` os is supported.
3. Target must be `nsis`
4. `oneClick` = `true` and `perMachine` = `false`

## Installation

#### Step 1:

```sh
npm install @electron-delta/builder
```

#### Step 2:

Create a file name called `.electron-delta.js` in the root of the project.

#### Step 3:

In the `electron-builder` config, mention the above file as `afterAllArtifactBuild` hook.

```json
"build": {
    "appId": "com.electron.sample-app",
    "afterAllArtifactBuild": ".electron-delta.js",
    "win": {
      "target": ["nsis"],
      "publish": ["github"]
    },
    "nsis": {
      "oneClick": true,
      "perMachine": false,
    }
}
```

#### Step 4:

Paste the following code in the `.electron-delta.js` file. It will be executed after the app is built.

```js
// .electron-delta.js
const DeltaBuilder = require("@electron-delta/builder");
const path = require("path");

const options = {
  productIconPath: path.join(__dirname, "icon.ico"),
  productName: "electron-sample-app",

  getPreviousReleases: async () => {
    return [
      {
        version: '0.0.12',
        url: 'https://github.com/electron-delta/electron-sample-app/releases/download/v0.0.12/electron-sample-app-0.0.12.exe'
      },
      {
        version: '0.0.11',
        url: 'https://github.com/electron-delta/electron-sample-app/releases/download/v0.0.11/electron-sample-app-0.0.11.exe'
      },
      {
        version: '0.0.9',
        url: 'https://github.com/electron-delta/electron-sample-app/releases/download/v0.0.9/electron-sample-app-0.0.9.exe'
      }
    ];
  },
  sign: async (filePath) => {
    // sign each delta executable
  },
};

exports.default = async function (context) {
  const deltaInstallerFiles = await DeltaBuilder.build({
    context,
    options,
  });
  return deltaInstallerFiles;
};
```
