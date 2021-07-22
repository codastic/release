
### v1.9.1 / 2021-07-22 14:03:48

- Bump hosted-git-info from 2.7.1 to 2.8.9 (i: dependabot[bot], r: Mario Volke, c: [6eb4c82](https://github.com/codastic/release/commit/6eb4c82))
- Bump glob-parent from 5.0.0 to 5.1.2 (i: dependabot[bot], r: Mario Volke, c: [8b94562](https://github.com/codastic/release/commit/8b94562))
- Bump lodash from 4.17.19 to 4.17.21 (i: dependabot[bot], r: Mario Volke, c: [eeec27d](https://github.com/codastic/release/commit/eeec27d))
- Fix abbreviated commits in update changelog with different length (i: Mario Volke, r: Christian Ranz, c: [08cb6e1](https://github.com/codastic/release/commit/08cb6e1))

### v1.9.0 / 2021-03-22 07:41:27

- Filter pull requests from open changes as soon as first commit matches entry in changelog (i: Mario Volke, r: Christian Ranz, c: [08ab166](https://github.com/codastic/release/commit/08ab166))
- Bump node-fetch from 2.3.0 to 2.6.1 (i: dependabot[bot], r: Mario Volke, c: [141bcc9](https://github.com/codastic/release/commit/141bcc9))
- Bump lodash from 4.17.15 to 4.17.19 (i: dependabot[bot], r: Mario Volke, c: [4b470f4](https://github.com/codastic/release/commit/4b470f4))
- Fix major vulnerabilities (i: Chris Ranz, r: Mario Volke, c: [4239863](https://github.com/codastic/release/commit/4239863))
- Bump acorn from 6.2.1 to 6.4.1 (i: dependabot[bot], r: Mario Volke, c: [78b703a](https://github.com/codastic/release/commit/78b703a))

### v1.8.0 / 2020-01-27 15:05:17

- Fix typo in buildCommands, fixes #18 (i: Chris Ranz, r: Mario Volke, c: [171bb55](https://github.com/codastic/release/commit/171bb55))
- Update README on update-changelog usage (i: Mario Volke, r: Christian Ranz, c: [372235c](https://github.com/codastic/release/commit/372235c))
- Bump eslint-utils from 1.4.0 to 1.4.3 (i: dependabot[bot], r: Christian Ranz, c: [bcbbcb7](https://github.com/codastic/release/commit/bcbbcb7))
- Add interactive mode to update changelog script (i: Mario Volke, r: Christian Ranz, c: [5a88f81](https://github.com/codastic/release/commit/5a88f81))

### v1.7.1 / 2019-07-31 14:45:25

- Fix parsing of changelog with linked commits (i: Mario Volke, r: Christian Ranz, c: [6d70047](https://github.com/codastic/release/commit/6d70047))

### v1.7.0 / 2019-07-31 13:55:08

- Document link-commit feature in readme (i: Chris Ranz, r: Mario Volke, c: [a847d7a](https://github.com/codastic/release/commit/a847d7a))
- Update critical dependencies (i: Mario Volke, r: Christian Ranz, c: [3fe7967](https://github.com/codastic/release/commit/3fe7967))
- Optionally link commit hash in changelog (i: Mario Volke, r: Christian Ranz, c: [2c06d71](https://github.com/codastic/release/commit/2c06d71))

### v1.6.0 / 2019-05-22 14:33:00

- Support varying length of abbreviated commit hashes in update changelog (i: Mario Volke, r: Jonathan Häberle, c: 566115c)

### v1.5.0 / 2018-11-30 07:44:53

- Update dependencies (i: Mario Volke, r: Christian Ranz, c: c67c249)

### v1.4.1 / 2018-05-23 10:02:19

- Fix missing title in changelog when using VisualStudio Team Services (i: Mario Volke, r: Jonathan Häberle, c: a84e1e8)

### v1.4.0 / 2018-05-22 11:41:29

- Update README to reflect api changes in changelog script (i: Mario Volke, r: Jonathan Häberle, c: bd50dd2)
- Add changes for node v10 (i: Henry Pötzl, r: Mario Volke, c: c301d9f)
- Add support for Visual Studio Team Services in changelog (i: Mario Volke, r: Jonathan Häberle, c: e9081f8)

### v1.3.0 / 2018-02-28 11:11:17

- Add files built via `--build-command` if not ignored (i: Chris Ranz, r: Mario Volke, c: bc55a82)

### v1.2.0 / 2018-01-16 12:33:09

- Make reviewer in changelog optional in bitbucket (i: Mario Volke, r: Christian Ranz, c: 1cdaaaa)

### v1.1.0 / 2017-07-22 08:21:38

- Namespace package, fix readme and prompt order in release-github script (i: Chris Ranz, r: Mario Volke, c: e367197)

### v1.0.0 / 2017-07-21 11:55:43

- Automatically set upstream and create the release branch (i: Chris Ranz, r: Mario Volke, c: 1f8e8db)
- Add proper readme (i: Chris Ranz, r: Mario Volke, c: b03a110)
- Add travis configuration to run tests (i: Chris Ranz, r: Mario Volke, c: 48df58a)
- Add release-github, release and update-changelog binaries (i: Mario Volke, r: Christian Ranz, c: 6d6fd95)
