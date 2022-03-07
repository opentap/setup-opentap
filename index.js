const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');

main().catch((error) => setFailed(error.message));

async function main() {
  try {
    let args = [];
    // Get version of opentap to download
    var opentapVersion = core.getInput('version');
    if (opentapVersion){
      args.push("version=" + opentapVersion);
    }
  
    // Get current arch
    args.push("architecture=x64")

    // Get current os
    args.push("os=linux")
    
    // Download OpenTAP
    core.info('Downloading OpenTAP: ' + args);
    const downloadedFilepath = await tc.downloadTool('https://packages.opentap.io/3.0/DownloadPackage/OpenTAP?' + args.join("&"));

    // Extract OpenTAP package
    core.info('Unzipping OpenTAP: ' + downloadedFilepath);
    await tc.extractZip(downloadedFilepath, '/opt/tap');
    await exec.exec("ls", ["/opt/tap"])

    // Set write permissions
    core.info("Configuring OpenTAP")
    await exec.exec("chmod", ["+x",  "/opt/tap/tap"]);

    // Add to path env
    core.addPath('/opt/tap')

    // list installed packages
    await exec.exec('tap', ["package", "list", "-i"])
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}