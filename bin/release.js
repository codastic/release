#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const minimist = require('minimist');
const semver = require('semver');

const argv = minimist(process.argv, {
  string: ['push-build', 'target-branch', 'build'],
  default: {
    'push-build': null,
    'target-branch': null,
    'build-command': null
  }
});

const fileExists = fs.existsSync || fs.accessSync;
const exec = childProcess.exec;

const toVersion = argv._.pop();
const npmPackageDirectory = argv._.pop();

const cdPath = path.resolve(process.cwd(), npmPackageDirectory);
const packageJsonPath = path.resolve(process.cwd(), npmPackageDirectory, 'package.json');
const changelogPath = path.resolve(process.cwd(), npmPackageDirectory, 'CHANGELOG.md');
let pushBuildDir;
if (argv['push-build']) {
  pushBuildDir = path.resolve(process.cwd(), npmPackageDirectory, argv['push-build']);
}

const formattedDate = new Date().toISOString()
  .replace(/T/, ' ')
  .replace(/\..+/, '');

if (!toVersion || !fileExists(packageJsonPath) || argv.help) {
  console.info([
    'Bumps a new versioned release of the current state into CHANGELOG.md and package.json',
    'Uses "git" and "npm".\n',
    'Usage: release.js NPM_PACKAGE_DIR [<newversion> | major | minor | patch | prerelease] [options]',
    'Options:',
    '  --push-build (optional) Push the build in this ignored folder to the version branch.',
    '  --target-branch (optional) (default: MAJOR.x) The branch where the release will be pushed to.',
    '  --build-command (optional) Run the build to be able to include the new version from package.json'
  ].join('\n'));
  process.exit(1);
}

const packageJson = require(packageJsonPath);
let newVersion; // Used as the version that the release should be bumped with

if (semver.valid(toVersion) && semver.gt(toVersion, packageJson.version)) {
  newVersion = toVersion;
} else {
  newVersion = semver.inc(packageJson.version, toVersion);
}

if (newVersion === null) {
  console.error(`Current version "${packageJson.version}" just can be bumped to a higher version`);
  process.exit(1);
}
// Set the new branch to the major Version if we release to version
const majorVersion = semver.parse(newVersion).major;

// Used to create|merge a major-branch
let newBranchName;
if (argv['target-branch']) {
  newBranchName = argv['target-branch'];
} else {
  newBranchName = `${majorVersion}.x`;
}

const switchPathCommands = [
  `cd ${cdPath} &&`
];

const changelogCommands = fileExists(changelogPath) ? [
  '# add version string to CHANGELOG and commit CHANGELOG',
  `echo "\\n### v${newVersion} / ${formattedDate}\\n\\n$(cat ${changelogPath})" > ${changelogPath} &&`,
  `git add ${changelogPath} &&`,
  `git commit -m "Prepare CHANGELOG for version v${newVersion}" &&`
] : [];

const pushBuildCommands = [
  '# push build',
  'rm -rf ./build',
  `cp -r ${pushBuildDir}/. ./build`,
  'git add --force ./build',
  `git commit -m "Add build in ${argv['push-build']} to branch ${newBranchName}" &&`
];

const pullCurrentUpstreamCommands = [
  '# pull the current upstream state',
  'git pull --all --tags &&'
];

const updatePackageJsonCommands = [
  '# updates package.json, does git commit and git tag',
  `npm --no-git-tag-version version ${newVersion} &&`,
  `git commit -am "${newVersion}"`
];

const buildCommands = [
  '# Run the build script',
  `${argv['build-command']} &&`
];

const pushUpstreamCommands = [
  '# push everything upstream',
  'git push &&',
  'git push --tags &&'
];

const saveCurrentBranchNameCommands = [
  '# save current branch to return to it later',
  'releaseBranchName=$(git symbolic-ref HEAD --short) &&'
];

const createReleaseBranchCommands = [
  `echo "### checkout|create branch ${newBranchName}, set upstream to origin" &&`,
  `git checkout ${newBranchName} &&`,
  '# when major branch does not exist on remote, then push it to origin',
  `git ls-remote --exit-code . origin/${newBranchName} || git push origin ${newBranchName} -u  &&`
];

const pullCommands = [
  '# pull the current upstream state',
  'git fetch --all &&'
];

const updateReleaseBranchCommands = [
  '# update major branch with changes from this release',
  'git merge $releaseBranchName &&',
  `git tag -a v${newVersion} -m "Tag v${newVersion}"`,
  `git push -u --force --tags origin ${newBranchName}&&`
];

const switchToCurrentBranchCommands = [
  '# go back to release branch',
  'git checkout $releaseBranchName'
];

const cmd = [].concat(
  '############ EXECUTE THE FOLLOWING COMMANDS ################',
  switchPathCommands,
  pullCurrentUpstreamCommands,
  changelogCommands,
  updatePackageJsonCommands,
  argv['build-command'] ? buildCommands : [],
  pushUpstreamCommands,
  saveCurrentBranchNameCommands,
  createReleaseBranchCommands,
  pullCommands,
  argv['push-build'] ? pushBuildCommands : [],
  updateReleaseBranchCommands,
  switchToCurrentBranchCommands,
  '########### END EXECUTE THE FOLLOWING COMMANDS ##############'
).join('\n');

console.log(cmd);

const child = exec(cmd, { maxBuffer: 1024 * 1000 }, (error) => {
  if (error) {
    throw error;
  }
});

child.stderr.pipe(process.stderr);
child.stdout.pipe(process.stdout);
