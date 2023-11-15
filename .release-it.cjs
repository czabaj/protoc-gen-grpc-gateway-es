const version = "${version}";

module.exports = {
  git: {
    push: true,
    tagName: `v${version}`,
    commitsPath: ".",
    commitMessage: `chore: released version v${version}`,
    requireCommits: true,
    requireCommitsFail: false,
  },
  github: {
    release: true,
    releaseName: `v${version}`,
  },
  hooks: {
    "before:init": "bun test",
    "before:git:release": ["git add --all"],
  },
  npm: {
    publish: false,
    versionArgs: ["--workspaces false"],
  },
  plugins: {
    "@release-it/conventional-changelog": {
      path: ".",
      infile: "CHANGELOG.md",
      preset: "conventionalcommits",
      gitRawCommitsOpts: {
        path: ".",
      },
    },
  },
};
