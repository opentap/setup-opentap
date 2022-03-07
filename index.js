const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');

main().catch((error) => setFailed(error.message));

async function main() {
  try {

    // download dotnet install script
    core.info("Downloading dotnet");
    const downloadedFilepath = await tc.downloadTool('https://dot.net/v1/dotnet-install.sh');

    // Make script executable
    await exec.exec("chmod", ["+x",  downloadedFilepath]);

    // Install dotnet 6
    core.info("Installing dotnet");
    await exec.exec(downloadedFilepath, ["-c", "6.0"]);


    let args = [];
    // Get version/arch and os of opentap to download
    args.push("version=" + core.getInput('version') ? core.getInput('version') : "");
    args.push("architecture=" + core.getInput('architecture') ? core.getInput('architecture') : "x64")
    args.push("os=" + core.getInput('os') ? core.getInput('os') : "linux")
    
    // Download OpenTAP
    core.info('Downloading OpenTAP: ' + args);
    downloadedFilepath = await tc.downloadTool('https://packages.opentap.io/3.0/DownloadPackage/OpenTAP?' + args.join("&"));

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