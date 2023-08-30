const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const fs = require("fs");
const os = require("os");

main().catch((error) => setFailed(error.message));

const INSTALL_DIRS = {
  linux: "/opt/tap",
  windows: "C:/Program Files/OpenTAP",
  macos: "/Users/runner/Library/OpenTAP",
};

function GetAuthenticationSettings(repositories) {
  let tokenInfos = repositories.map(r => {
    return `
    <TokenInfo>
      <AccessToken>${r.token}</AccessToken>
      <Domain>${r.domain}</Domain>
    </TokenInfo>
    `
  })

  return `<?xml version="1.0" encoding="utf-8"?>
  <AuthenticationSettings type="OpenTap.Authentication.AuthenticationSettings">
    <Tokens type="System.Collections.Generic.List\`1[[OpenTap.Authentication.TokenInfo]]">
      ${tokenInfos}
    </Tokens>
  </AuthenticationSettings>`;
}

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
        platform = "linux";
        break;
    }

    let args = [];
    // Get version/arch and os of opentap to download
    const version = core.getInput("version");
    const hasVersion = !!version;
    if (hasVersion) args.push("version=" + core.getInput("version"));
    if (!!core.getInput("architecture"))
      args.push("architecture=" + core.getInput("architecture"));
    else args.push("architecture=" + (os.arch() == "x32" ? "x86" : "x64"));
    if (!!core.getInput("os")) args.push("os=" + core.getInput("os"));
    else args.push("os=" + platform);

    // Download OpenTAP
    core.info("Downloading OpenTAP: " + args);
    const downloadedFilepath = await tc.downloadTool(
      "https://packages.opentap.io/3.0/DownloadPackage/OpenTAP?" +
        args.join("&")
    );

    // Extract OpenTAP package
    core.info("Unzipping OpenTAP: " + downloadedFilepath);
    const destDir = INSTALL_DIRS[platform];
    await tc.extractZip(downloadedFilepath, destDir);

    // Set write permissions
    core.info("Configuring OpenTAP");
    if (platform !== "windows") {
      await exec.exec("chmod", ["+x", destDir + "/tap"]);
    }

    // Add to path env
    core.addPath(destDir);

    // Install packages
    if (core.getInput("packages")) {
      const domainPattern = /^(?<scheme>https?:\/\/)?(?<domain>.+)$/;

      const repositories = [
        {
          url: "https://packages.opentap.io",
          domain: domainPattern.exec("https://packages.opentap.io").groups["domain"],
          token: core.getInput("token")
        }
      ];
      const additionalRepository = core.getInput("additional-repository");
      if (!!additionalRepository){
        repositories.push({
          url: additionalRepository,
          domain: domainPattern.exec(additionalRepository).groups["domain"],
          token: core.getInput("additional-repository-token")
        });
      }

      const hasToken = repositories.some(r => !!r.token);
      // If an OpenTAP version was specified, verify it is recent enough to support user tokens
      if (hasVersion && hasToken) {
        const majorMinorPattern = /^(?<major>\d+)\.(?<minor>\d+).*/;
        const match = majorMinorPattern.exec(version);
        const minor = Number(match.groups["minor"]);
        if (minor <= 21) {
          core.setFailed(
            "repository-token support requires OpenTAP 9.22.0 or greater."
          );
          return;
        }
      }

      // If a token was specified, it should be written to AuthenticationSettings.xml in the tap installation.
      if (hasToken) {
        var authenticationSettings = GetAuthenticationSettings(domain, token);
        const settingsDir = destDir + "/Settings/";
        const destFile = settingsDir + "AuthenticationSettings.xml";
        if (!fs.existsSync(settingsDir)) {
          fs.mkdirSync(settingsDir);
        }
        fs.writeFileSync(destFile, authenticationSettings);
        core.debug(`Wrote authentication settings to ${destFile}`);
      }

      // Parse packages argument
      var pkgSpecs = core.getInput("packages").split(",");
      var image = { Packages: [], Repositories: repositories };
      for (let i = 0; i < pkgSpecs.length; i++) {
        const name = pkgSpecs[i].split(":")[0];
        const ver = pkgSpecs[i].split(":")[1];
        image.Packages.push({ Name: name, Version: ver });
      }

      // Write opentap image
      const imageJson = JSON.stringify(image, null, 2);
      fs.writeFileSync("image.json", imageJson);
      core.debug("Image: " + imageJson);
      await exec.exec("tap", [
        "image",
        "install",
        "image.json",
        "--non-interactive",
        "--merge",
        "--force",
      ]);
    }

    // list installed packages
    await exec.exec("tap", ["package", "list", "--installed"]);
  } catch (error) {
    core.setFailed(error.message);
  }
}
