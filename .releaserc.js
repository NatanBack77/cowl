module.exports = {
  branches: [
    "main",
    "develop",
    { name: "release/*", channel: "next" }
  ],
  repositoryUrl: "git@github.com:NatanBack77/cowl.git",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "Cowl.js"],
        message: "docs: ${nextRelease.version}"
      }
    ]
  ],
  prepareCmd: "npm version ${nextRelease.version} -m 'docs: %s'",
  verifyConditions: ["@semantic-release/github"],
  publish: ["@semantic-release/github"]
};
