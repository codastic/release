# codastic-release
A collection of release and changelog management script you can easily use via NPM.

## Installation

```bash
$ npm install codastic-release
```

## Features

- Creates a `CHANGELOG.md` containing all commits starting with `Merge pull request…`.
- Bumps the package version and adds version headlines to the  `CHANGELOG.md`.
- Creates a GitHub release.

## Quick Start

Running `npm install codastic-release` adds the following scripts to you local `node_modules/.bin` folder:

- **update-changelog**: Adds merged pulled requests since last versioned release to `CHANGELOG.md`,
Supports pull requests from Github and Bitbucket.

- **release**: Bumps a new versioned release of the current state into `CHANGELOG.md` and `package.json`.

- **release-github**: Creates a Github release by zipping and uploading the build folder and using current version number from `package.json`.

To integrate the release process into your project/package just run `$ npm install --save-dev codastic-release`.

Then use the installed scripts in you `package.json` scripts. e.g.

```json
{
  "scripts": {
    "build": "[your build command]",
    "changes": "update-changelog --dry-run .",
    "prerelease": "npm run -s test && update-changelog .",
    "release": "./bin/release.js .",
    "postrelease": "npm run -s build && release-github ./ ./dist",
    "test": "[your test command]"
  }
}
```



## update-changelog

```bash
$ update-changelog ROOT_DIR [OPTIONS]
```

### Options

- `--help`: Outputs help.

- `--dry-run`: *(optional)* Outputs changes instead of writing to `CHANGELOG.md`.

- `--since`: *(optional)* Limit search for pull requests to the given ISO date (e.g. `--since='2017-01-01'`).

## release

```bash
$ release NPM_PACKAGE_DIR [<newversion> | major | minor | patch | prerelease] [options]
```

### Options

- `--help`: Outputs help.

- `--push-build`: *(optional)* Push the build in this ignored folder to the version branch.

- `--target-branch`: *(optional)* (default: MAJOR.x) The branch where the release will be pushed to (e.g. `--target-branch='master'`).

- `--build-command`: *(optional)* Run the build to be able to include the new version from `package.json` (e.g `--build-command='npm run build' ./"`).

## release-github

```bash
$ github-release ROOT_DIR BUILD_DIR
```

If you run this script the first time, it asks for a GitHub token, which will be stored in `[ROOT_DIR]/.github-release`. [Here](https://github.com/blog/1509-personal-api-tokens) you can learn how how create your personal GitHub token.

**IMPORTANT** To prevent pushing your personal token to a remote you should add this file to your `.gitignore`.

### Options

- `--help`: Outputs help.

## Requirements

- Node 6.10 or higher is required.
```bash
node --version  # 6.10 or higher
```

- Git version 2.7 or higher is required for github release script.
```bash
git --version  # 2.7 or higher
```

- The repository needs to be checked out via SSH. [Need help?](https://help.github.com/articles/changing-a-remote-s-url/#switching-remote-urls-from-https-to-ssh)
```bash
git remote set-url origin git@github.com:SevenOneMedia/adtec-core.git
```

- The release script uses the GitHub API and therefore requires an [accesstoken](https://github.com/settings/tokens/new).
The script will prompt automatically for that token once and stores it in `.git-release`. Make sure the following permissions are granted when creating a new token on GitHub:
 ```markdown
 [x] repo       Full control of private repositories
 ```
