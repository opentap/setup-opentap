# Setup-OpenTAP GitHub Action
GitHub action that installs everything needed to run OpenTAP.

## Usage
Here is a small example of how to use the action.
```yml
- uses: opentap/setup-opentap@v1.0
  with:
    version: 9.17.0
    packages: 'Demonstration,PackagePublish:rc,TUI:any'
```

## Arguments
There are a few arguments to help you select the right version of OpenTAP to install.

- `version` Defaults to the latest release
- `architecture` - Defaults to the architecture of the runner  
- `os` - Defaults to the OS of the runner
- `packages` - a list of additional packages to install. Format: `<name1>:<version1>,<name2>:<version2>`. This option requires `version` to be 9.17 or greater.
