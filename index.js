const core = require('@actions/core');
const { exec } = require('@actions/exec');
const tc = require('@actions/tool-cache');


main().catch((error) => setFailed(error.message));

async function main() {
  try {
      // Get version of opentap to download
      var opentapVersion = core.getInput('version');
      if (opentapVersion){
        let args = [];
        args.push("version=" + opentapVersion);

        // Get current arch
        args.push("architecture=x64")

        // Get current os
        args.push("os=linux")
        
        // Download OpenTAP
        core.info('Installing OpenTAP: ' + args);
        const downloadedFilepath = await tc.downloadTool('https://packages.opentap.io/3.0/DownloadPackage/OpenTAP?' + args.join("&"));

        // Extract OpenTAP package
        await tc.extractZip(downloadedFilepath, 'opt/tap');

        // Add to path env
        core.addPath('/opt/tap')
      }

      // Install packages
      var package = core.getInput('package')
      if (package){
        core.info('Installing package: ' + package);
        exitCode = exec.exec('tap', ["package",  "install", package], {
            listeners: {
              stdout: data => {
                core.info(data.toString())
              }
            }
        });
      }
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}