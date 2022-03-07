const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
import * as ioUtil from '@actions/io/lib/io-util'


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
        core.info('Downloading OpenTAP: ' + args);
        const downloadedFilepath = await tc.downloadTool('https://packages.opentap.io/3.0/DownloadPackage/OpenTAP?' + args.join("&"));

        // Extract OpenTAP package
        core.info('Unzipping OpenTAP: ' + args);
        await tc.extractZip(downloadedFilepath, '/opt/tap');

        // Set write permissions
        core.info("Configuring OpenTAP")
        ioUtil.chmod("/opt/tap/tap", '+x');

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