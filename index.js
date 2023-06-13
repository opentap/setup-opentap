const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const fs = require('fs');
const os = require('os');

main().catch((error) => setFailed(error.message));

const INSTALL_DIRS = {
  "linux": "/opt/tap",
  "windows": "C:/Program Files/OpenTAP",
  "macos": "/Users/runner/Library/OpenTAP"
};

async function main() {
  try {
    let platform = "linux";
    const platformString = os.platform();
    // Platform enumeration options from: https://nodejs.org/api/os.html#os_os_platform
    switch (platformString) {
      case "darwin":
        platform = "macos";
        break;
      case "win32":
        platform = "windows";
        break;
      default: // freebsd, linux, openbsd, sunos, android, etc. They should all work similar to linux
        platform = "linux"
        break;
    }

    let args = [];
    // Get version/arch and os of opentap to download
    if (!!core.getInput('version'))
      args.push("version=" + core.getInput('version'));
    if (!!core.getInput('architecture'))
      args.push("architecture=" + core.getInput('architecture'));
    else
      args.push("architecture=" + (os.arch() == "x32" ? "x86" : "x64")  );
    if (!!core.getInput('os'))
      args.push("os=" + core.getInput('os'));
    else
      args.push("os=" + platform);
    
    // Download OpenTAP
    core.info('Downloading OpenTAP: ' + args);
    const downloadedFilepath = await tc.downloadTool('https://packages.opentap.io/3.0/DownloadPackage/OpenTAP?' + args.join("&"));

    // Extract OpenTAP package
    core.info('Unzipping OpenTAP: ' + downloadedFilepath);
    const destDir = INSTALL_DIRS[platform]
    await tc.extractZip(downloadedFilepath, destDir);

    // Set write permissions
    core.info("Configuring OpenTAP")
    if (platform !== "windows"){
      await exec.exec("chmod", ["+x", destDir + "/tap"]);
    }

    // Add to path env
    core.addPath(destDir)
    
    // Install packages
    if (core.getInput('packages')) {
      var pkgSpecs = core.getInput('packages').split(",");
      var image = { Packages: [], Repositories: ["packages.opentap.io"] };
      for (let i = 0; i < pkgSpecs.length; i++) {
        const name = pkgSpecs[i].split(":")[0];
        const ver = pkgSpecs[i].split(":")[1];
        image.Packages.push({ Name: name, Version: ver });
      }
      const imageJson = JSON.stringify(image, null, 2);
      fs.writeFileSync("image.json", imageJson);
      core.debug("Image: " + imageJson);
      await exec.exec('tap', ["image", "install", "image.json", "--non-interactive", "--merge", "--force"])
    }

    // list installed packages
    await exec.exec('tap', ["package", "list", "--installed"])
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}
