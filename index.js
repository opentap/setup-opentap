const core = require('@actions/core');
const path = require('path');
const {chmodSync} = require('fs');
const { exec } = require('@actions/exec');

try {
    // Download OpenTAP
    var opentapVersion = core.getInput('opentap-version');
    console.log('Installing OpenTAP version: ', opentapVersion);
    let scriptPath = path.join(__dirname, 'install-opentap.sh').replace(/'/g, "''"); // Format path to sh file.
    chmodSync(scriptPath, '777'); // Set permissions to execute
    let exitCode = exec.exec(scriptPath, opentapVersion, {
        listeners: {
          stdout: data => {
            console.log(data.toString())
          }
        }
    });

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