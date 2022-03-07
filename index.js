const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const os = require('os');

const WIN_INSTALL_PATH = "C:/Program Files/OpenTAP";
const UNIX_INSTALL_PATH = "/opt/tap";

main().catch((error) => setFailed(error.message));

async function main() {
  try {
    core.info(os.platform());
    const isUnix = os.platform() != "win32";
    const destDir = isUnix ? UNIX_INSTALL_PATH : WIN_INSTALL_PATH;

    let args = [];
    // Get version/arch and os of opentap to download
    args.push("version=" + (!!core.getInput('version') ? core.getInput('version') : ""));
    args.push("architecture=" + (!!core.getInput('architecture') ? core.getInput('architecture') : "x64"));
    args.push("os=" + (!!core.getInput('os') ? core.getInput('os') : "linux"));
    
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

    // list installed packages
    await exec.exec('tap', ["package", "list", "-i"])
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}