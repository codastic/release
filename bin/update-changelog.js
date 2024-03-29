#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const minimist = require('minimist');
const prompts = require('prompts');

const argv = minimist(process.argv, {
  boolean: ['dry-run', 'help', 'hide-reviewer'],
  string: ['since'],
  default: {
    'dry-run': false,
    'hide-reviewer': false
  }
});

const { exec } = childProcess;
const rootDirectory = argv._.pop();

const changelogName = 'CHANGELOG.md';
const changelogPath = path.resolve(process.cwd(), rootDirectory, changelogName);

if (argv.help) {
  console.log([
    `Adds merged pulled requests since last versioned release to ${changelogName}`,
    'Supports pull requests from Github and Bitbucket. Uses "git" and "npm".\n',
    'Usage: update-changelog ROOT_DIR',
    'Options:',
    '  --dry-run (optional) Outputs changes instead of writing to CHANGELOG.md.',
    '  --since (optional) Limit search for pull requests to the given ISO date (e.g. "2017-01-01").',
    '  --hide-reviewer (optional) If set the reviewer will not be put into the CHANGELOG.md.',
    '  --interactive (optional) If set every addition to the changelog has to be confirmed manually.',
    '  --link-commit (optional) If set the commit hash in the output will be linked.'
      + ' Expects a template URL in the form of "http://example.com/:commit".'
  ].join('\n'));
  process.exit(0);
}

function getPullRequests(callback) {
  // Get latest 500 pull requests
  let cmd = 'git --no-pager log '
    + '--grep \'Merged in .* (pull request #.*)\' ' // Butbucket format
    + '--grep \'Merge pull request #.*\' ' // Github format
    + '--grep \'Merged PR .*: .*\' ' // VisualStudio Team Services format
    + '--merges '
    + '--pretty=\'format:__pr-start__%n%h%n%an%n%s%n%b%n__pr-end__\' '
    + '-500';

  if (argv.since) {
    cmd += ` --date=iso --since='${argv.since}'`;
  }

  const child = exec(cmd, (error, stdout) => {
    if (error) {
      throw error;
    }
    const pullRequests = [];
    let group;

    stdout.split('\n').forEach((line) => {
      if (!line) {
        // Filter empty lines
        return;
      }

      if (line === '__pr-start__') {
        group = [];
      } else if (line === '__pr-end__') {
        const commit = group.shift();
        const reviewer = group.shift();
        const subject = group.shift();
        const approvedBy = /^Approved-by:\s([^<]+)\s<([^>]+)>$/;
        let message = group
          .filter(l => !approvedBy.test(l))
          .join()
          .replace(/\n|\r/g, '')
          .trim();

        // Visual Studio Team Services do not guarantee to provide the PR title within the body
        const matches = /Merged PR \d+: (.*)/.exec(subject);
        if (matches) {
          [message] = matches;
        }

        pullRequests.push({
          commit,
          reviewer,
          message
        });
      } else {
        group.push(line);
      }
    });
    callback(pullRequests);
  });
  child.stderr.pipe(process.stderr);
}

function findCommitsInChangelog(callback) {
  const matcher = /c: \[{0,1}([^)\]]+)/;
  const commits = [];
  const input = fs.createReadStream(changelogPath);
  const lineReader = readline.createInterface({
    input
  });

  input.on('error', () => {
    console.error('Warning: %s does not exist, yet. Attempt to create file now.', changelogName);
    callback([]);
  });

  lineReader.on('line', (line) => {
    const matches = matcher.exec(line);
    if (matches) {
      commits.push(matches[1]);
    }
  });

  lineReader.on('close', () => {
    callback(commits);
  });
}

function matchAbbreviatedCommit(abbrCommit, commits) {
  for (let length = 1; length <= abbrCommit.length; length += 1) {
    if (commits.indexOf(abbrCommit.substr(0, length)) >= 0) {
      return true;
    }
  }

  return commits.some(commit => commit.startsWith(abbrCommit));
}

function filterPullRequests(pullRequests, commits) {
  const filteredPullRequests = [];
  for (let i = 0; i < pullRequests.length; i += 1) {
    if (matchAbbreviatedCommit(pullRequests[i].commit, commits)) {
      break;
    }

    filteredPullRequests.push(pullRequests[i]);
  }

  return filteredPullRequests;
}

function resolveImplementers(pullRequests, callback) {
  function next(pos) {
    if (pos >= pullRequests.length) {
      callback(pullRequests);
      return;
    }

    // The second parent is always the latest commit of the merged branch
    const cmd = `git show ${pullRequests[pos].commit}^2 --format='%an' --no-patch`;
    const child = exec(cmd, (error, stdout) => {
      if (error) {
        throw error;
      }

      const pullRequest = pullRequests[pos];

      // eslint-disable-next-line no-param-reassign
      pullRequest.implementer = stdout.replace(/\n|\r/g, '').trim();

      // In Bitbucket and Visual Studio Team Services it is not possible to find the reviewer within git data
      if (argv['hide-reviewer'] || pullRequest.implementer === pullRequest.reviewer) {
        pullRequest.reviewer = null;
      }

      next(pos + 1);
    });
    child.stderr.pipe(process.stderr);
  }

  next(0);
}

function stringifyPullRequest({
  message,
  implementer,
  reviewer,
  commit
}) {
  const commitString = argv['link-commit'] ? `[${commit}](${argv['link-commit'].replace(':commit', commit)})` : commit;

  // Bitbucket case
  if (!reviewer) {
    return `- ${message} (i: ${implementer}, c: ${commitString})\n`;
  }
  return `- ${message} (i: ${implementer}, r: ${reviewer}, c: ${commitString})\n`;
}

function filterPullRequestsInteractively(pullRequests) {
  return pullRequests.reduce((promise, pullRequest) => (
    promise.then(async (filteredPullRequests) => {
      const response = await prompts({
        type: 'confirm',
        name: 'value',
        initial: true,
        message: stringifyPullRequest(pullRequest)
      });

      if (!response.value) {
        return filteredPullRequests;
      }

      return [...filteredPullRequests, pullRequest];
    })
  ), Promise.resolve([]));
}

function prependToChangelog(str) {
  let data = Buffer.from('');
  try {
    data = fs.readFileSync(changelogPath); // Read existing contents into data
  } catch (error) {
    // Ignore when changelog does not exist yet.
  }

  const fd = fs.openSync(changelogPath, 'w+');
  const buffer = Buffer.from(str);
  fs.writeSync(fd, buffer, 0, buffer.length); // Write new data
  fs.writeSync(fd, data, 0, data.length); // Append old data
  fs.closeSync(fd);
}

getPullRequests((pullRequests) => {
  findCommitsInChangelog((commits) => {
    const newPullRequests = filterPullRequests(pullRequests, commits);

    resolveImplementers(newPullRequests, () => {
      (argv.interactive ? filterPullRequestsInteractively(newPullRequests) : Promise.resolve(newPullRequests)).then((finalPullRequests) => {
        if (finalPullRequests.length === 0) {
          console.error('Error: There are no new changes!');
          process.exit(1);
        }

        const changeString = finalPullRequests.map(stringifyPullRequest).join('');

        if (argv['dry-run']) {
          console.log(changeString);
        } else {
          prependToChangelog(changeString);
        }
      });
    });
  });
});
