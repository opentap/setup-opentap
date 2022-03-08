# Setup-OpenTAP GitHub Action
GitHub action that installs everything needed to run OpenTAP.

## Usage
Here is a small example of how to use the action.
```yml
- uses: opentap/setup-opentap@v1.0
  with:
    version: 9.17.0
```

## Arguments
There are a few arguments to help you select the right version of OpenTAP to install.

- `version` - Defaults to the latest release
- `architecture` - Defaults to x64
- `os` - Defaults to Linux
