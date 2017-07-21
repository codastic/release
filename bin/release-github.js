#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const prompt = require('prompt');
const readline = require('readline');
const GitHubApi = require('github');

prompt.message = 'Requires initial config';
prompt.start();

const argv = minimist(process.argv, {
  boolean: ['help'],
  string: ['push-build', 'unignore-build-pattern'],
  default: {
    'push-build': null,
    'unignore-build-pattern': null
  }
});

const github = new GitHubApi({
  headers: {
    'user-agent': 'Github-Release-Script'
  },
  timeout: 5000
});

const fileExists = fs.existsSync || fs.accessSync;
const exec = childProcess.exec;

const buildDirectory = argv._.pop();
const rootDirectory = argv._.pop();

const buildPath = path.resolve(process.cwd(), buildDirectory);
const packageJsonPath = path.resolve(process.cwd(), rootDirectory, 'package.json');
const changelogPath = path.resolve(process.cwd(), rootDirectory, 'CHANGELOG.md');
const configPath = path.resolve(process.cwd(), rootDirectory, '.github-release');

if (!fileExists(packageJsonPath) || !fileExists(buildPath) || argv.help) {
  console.info([
    'Creates a Github release by zipping and uploading the build folder and using current version number from package.json',
    'Uses "git".\n',
    'Usage: github-release.js ROOT_DIR BUILD_DIR'
  ].join('\n'));
  process.exit(1);
}

const packageJson = require(packageJsonPath);
const buildZipPath = `/tmp/build-${packageJson.name}.zip`;

function getRepositoryInfo() {
  console.info('Reading repository information.');
  return new Promise((resolve, reject) => {
    const cmd = 'git remote get-url origin';
    const child = exec(cmd, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      const matches = /@github\.com[:/]([^/]+)\/([^/]+)\.git/.exec(stdout);
      if (!matches) {
        reject(new Error('Github remote origin not found!'));
        return;
      }

      const [, owner, repo] = matches;
      console.info(`Owner: ${owner}, Reepo: ${repo}`);
      resolve({ owner, repo });
    });
    child.stderr.pipe(process.stderr);
  });
}

function getConfig() {
  return new Promise((resolve, reject) => {
    if (fileExists(configPath)) {
      fs.readFile(configPath, (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        let config;
        try {
          config = JSON.parse(data);
        } catch (error2) {
          reject(error2);
          return;
        }

        resolve(config);
      });
    } else {
      prompt.get(['accessToken'], (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        const config = {
          accessToken: result.accessToken
        };
        fs.writeFile(configPath, JSON.stringify(config, null, '  '), (error2) => {
          if (error2) {
            reject(error2);
            return;
          }

          resolve(config);
        });
      });
    }
  });
}

function createZipOfBuild() {
  console.info('Create dist zip to upload.');
  return new Promise((resolve, reject) => {
    const cmd = `rm -f ${buildZipPath} && cd ${buildPath} && zip -r ${buildZipPath} ./*`;
    const child = exec(cmd, (error) => {
      if (error) {
        console.error(`Error creating zip file. ${error.message}`);
        reject(error);
        return;
      }
      console.info('Zip file created.');
      resolve();
    });
    child.stderr.pipe(process.stderr);
  });
}

function getChanges() {
  return new Promise((resolve) => {
    if (!fileExists(changelogPath)) {
      resolve('');
      return;
    }

    const input = fs.createReadStream(changelogPath);
    const lineReader = readline.createInterface({
      input
    });

    let isInActiveBlock = false;
    let changes = '';

    lineReader.on('line', (line) => {
      const matches = /^### v([0-9.]+)/.exec(line);
      if (matches) {
        isInActiveBlock = matches[1] === packageJson.version;
      }

      if (isInActiveBlock && line[0] === '-') {
        changes += `${line}\n`;
      }
    });

    lineReader.on('close', () => {
      console.info('Created changelog.');
      console.info(changes);
      resolve(changes);
    });
  });
}

function createRelease(repoInfo, config, changes) {
  console.info('Create GitHub release.');
  github.authenticate({
    type: 'token',
    token: config.accessToken
  });

  return github.repos.createRelease({
    owner: repoInfo.owner,
    repo: repoInfo.repo,
    tag_name: `v${packageJson.version}`,
    name: `Version ${packageJson.version}`,
    body: changes
  })
  .then((release) => {
    console.info('Create GitHub release created.');
    console.info('Upload dist assets.');
    return github.repos.uploadAsset({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      id: release.data.id,
      filePath: buildZipPath,
      name: `${repoInfo.repo}-v${packageJson.version}.zip`
    })
    .catch((error) => {
      console.error(`Error uploading dist asssets. ${error.message}`);
    });
  })
  .catch((error) => {
    console.error(`Error creating github release. ${error.message}`);
  });
}

function promiseSeries(promiseTasks) {
  const results = [];
  return promiseTasks
  .map((promiseTask) => {
    if (typeof promiseTask !== 'function') {
      return () => promiseTask;
    }
    return promiseTask;
  })
  .reduce((chainedPromise, promiseTask) =>
      chainedPromise
      .then(promiseTask)
      .then((promiseTaskResult) => {
        results.push(promiseTaskResult);
        return promiseTaskResult;
      })
    , Promise.resolve()
  )
  .then(() => results);
}

promiseSeries([
  getRepositoryInfo,
  getConfig,
  getChanges,
  createZipOfBuild
]).then(([repoInfo, config, changes]) => (
  createRelease(repoInfo, config, changes)
    .then(() => {
      console.log(`Github release v${packageJson.version} created.`);
    })
)).catch((error) => {
  console.error(error.toString());
});
