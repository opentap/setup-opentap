const core = require('@actions/core');
const { exec } = require('@actions/exec');
const tc = require('@actions/tool-cache');
import { promisify } from "util";
const writeFileAsync = promisify(writeFile);

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
    core.info('Installing OpenTAP: ' + args);
    const downloadedFilepath = await tc.downloadTool('https://packages.opentap.io/3.0/DownloadPackage/OpenTAP?' + args.join("&"));

    // Extract OpenTAP package
    await tc.extractZip(downloadedFilepath, 'opt/tap');

    // Add to path env
    core.addPath('/opt/tap')

    // Install packages
    var packages = core.getInput('packages')
    if (packages){
        core.info('Installing packages: ' + packages);

        var image = {
          Packages: packages.map(p => {
            Name: p.name
            Version: p.version
          }),
          Repositories: ["https://packages.opentap.io"]
        }

        writeFileAsync("image.json", JSON.stringify(image))

        exitCode = exec.exec('tap', ["image",  "install", "image.json"], {
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