const core = require('@actions/core');
const { exec } = require('@actions/exec');
const tc = require('@actions/tool-cache');

try {
    let args = [];

    // Get version of opentap to download
    var opentapVersion = core.getInput('opentap-version');
    if (opentapVersion){
      args.push("version=" + opentapVersion);
    }

    // Get current arch
    args.push("architecture=x64")

    // Get current os
    args.push("os=linux")
    
    // Download OpenTAP
    console.log('Installing OpenTAP: ', args);
    const downloadedFilepath = await tc.downloadTool('https://packages.opentap.io/3.0/DownloadPackage/OpenTAP?' + args.join("&"));

    // Extract OpenTAP package
    await tc.extractZip(downloadedFilepath, 'opt/tap');

    // Add to path env
    core.addPath('/opt/tap')

    // Install packages
    var packages = core.getInput('packages')
    if (packages){
        console.log('Installing packages: ', packages);
        exitCode = exec.exec('tap', ["package",  "install"].concat(packages), {
            listeners: {
              stdout: data => {
                console.log(data.toString())
              }
            }
        });
    }
} 
catch (error) {
  core.setFailed(error.message);
}