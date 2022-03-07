const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const fs = require('fs');
const os = require('os');

const WIN_INSTALL_PATH = "C:/Program Files/OpenTAP";
const UNIX_INSTALL_PATH = "/opt/tap";

main().catch((error) => setFailed(error.message));

async function main() {
  try {
    const isUnix = os.platform() != "win32";
    const destDir = isUnix ? UNIX_INSTALL_PATH : WIN_INSTALL_PATH;

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
      args.push("os=" + (isUnix ? "linux" : "windows"));
    
    // Download OpenTAP
    core.info('Downloading OpenTAP: ' + args);
    const downloadedFilepath = await tc.downloadTool('https://packages.opentap.io/3.0/DownloadPackage/OpenTAP?' + args.join("&"));

    // Extract OpenTAP package
    core.info('Unzipping OpenTAP: ' + downloadedFilepath);
    await tc.extractZip(downloadedFilepath, destDir);

    // Set write permissions
    core.info("Configuring OpenTAP")
    if (isUnix){
      await exec.exec("chmod", ["+x", "/opt/tap/tap"]);
    }

    // Add to path env
    core.addPath(destDir)
    
    // Install packages
    core.info("Packages: " + core.getInput('packages'));
    var pkgSpecs = core.getInput('packages').split(",");
    if (pkgSpecs) {
      var image = { Repositories: ["packages.opentap.io"], Packages: [] };
      for (let i = 0; i < pkgSpecs.length; i++) {
        const name = pkgSpecs[i].split(":")[0];
        const ver = pkgSpecs[i].split(":")[1];
        image.Packages.push({ Name: name, Version: ver });
      }
      fs.writeFileSync("image.json", JSON.stringify(image));
      await exec.exec('tap', ["image", "install", "image.json", "--non-interactive", "--merge", "--force"])
    }

    // list installed packages
    await exec.exec('tap', ["package", "list", "--installed"])
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}