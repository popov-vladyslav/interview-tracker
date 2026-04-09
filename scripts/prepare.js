const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const gitDir = path.join(rootDir, ".git");
const gitConfigPath = path.join(gitDir, "config");

if (!fs.existsSync(gitDir) || !fs.existsSync(gitConfigPath)) {
  process.exit(0);
}

try {
  fs.accessSync(gitConfigPath, fs.constants.W_OK);
} catch {
  console.warn("Skipping husky install: .git/config is not writable.");
  process.exit(0);
}

const result = spawnSync("npx", ["husky"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 0);
