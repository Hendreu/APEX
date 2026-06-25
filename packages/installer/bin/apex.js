#!/usr/bin/env node

// src/index.ts
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
var REPO_URL = "https://github.com/Hendreu/APEX.git";
var APEX_DIR = path.join(os.homedir(), ".config", "apex");
var colors = {
  reset: "\x1B[0m",
  dim: "\x1B[2m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  cyan: "\x1B[36m"
};
function log(message) {
  console.log(message);
}
function success(message) {
  console.log(`${colors.green}${message}${colors.reset}`);
}
function warn(message) {
  console.log(`${colors.yellow}${message}${colors.reset}`);
}
function error(message) {
  console.log(`${colors.red}${message}${colors.reset}`);
}
function dim(message) {
  console.log(`${colors.dim}${message}${colors.reset}`);
}
function exec(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  return result.status ?? 1;
}
function execQuiet(command, args, cwd) {
  return spawnSync(command, args, { cwd, shell: process.platform === "win32" });
}
function checkCommand(cmd) {
  const result = execQuiet(process.platform === "win32" ? "where" : "which", [cmd]);
  return result.status === 0;
}
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
function isApexInstalled() {
  return fs.existsSync(APEX_DIR) && fs.existsSync(path.join(APEX_DIR, ".git"));
}
function isWindows() {
  return process.platform === "win32";
}
function getPlatform() {
  switch (process.platform) {
    case "darwin":
      return "darwin";
    case "linux":
      return "linux";
    case "win32":
      return "windows";
    default:
      return process.platform;
  }
}
function getArch() {
  switch (process.arch) {
    case "x64":
      return "x64";
    case "arm64":
      return "arm64";
    case "arm":
      return "arm";
    default:
      return process.arch;
  }
}
function getBinaryPath() {
  const platform = getPlatform();
  const arch = getArch();
  return path.join(APEX_DIR, "packages", "opencode", "dist", `apex-${platform}-${arch}`, "bin", platform === "windows" ? "apex.exe" : "apex");
}
function buildApex() {
  log("");
  log("Installing dependencies with bun (skipping native build scripts)...");
  const installResult = exec("bun", ["install", "--ignore-scripts"], APEX_DIR);
  if (installResult !== 0) {
    error("Failed to install dependencies.");
    return 1;
  }
  log("");
  log("Building APEX binary...");
  const buildResult = exec("bun", ["run", "build"], path.join(APEX_DIR, "packages", "opencode"));
  if (buildResult !== 0) {
    error("Failed to build APEX binary.");
    return 1;
  }
  const binaryPath = getBinaryPath();
  if (!fs.existsSync(binaryPath)) {
    error(`Binary not found at ${binaryPath}`);
    return 1;
  }
  success("APEX binary built successfully!");
  return 0;
}
function setup() {
  log("");
  log(`${colors.cyan}APEX Protocol Installer${colors.reset}`);
  log(dim("━".repeat(40)));
  log("");
  if (!checkCommand("git")) {
    error("git is required but not found in PATH.");
    log("Install git and try again: https://git-scm.com/downloads");
    process.exit(1);
  }
  if (!checkCommand("bun")) {
    error("bun is required but not found in PATH.");
    log("Install Bun first: https://bun.sh/docs/installation");
    process.exit(1);
  }
  if (isApexInstalled()) {
    warn(`APEX is already installed at ${APEX_DIR}`);
    log("Run `apex update` to pull the latest changes, or `apex` to start.");
    process.exit(0);
  }
  log(`Installing APEX into ${APEX_DIR}...`);
  ensureDir(path.dirname(APEX_DIR));
  const cloneResult = exec("git", ["clone", REPO_URL, APEX_DIR]);
  if (cloneResult !== 0) {
    error("Failed to clone the APEX repository.");
    process.exit(1);
  }
  const buildResult = buildApex();
  if (buildResult !== 0) {
    process.exit(1);
  }
  log("");
  success("APEX installed successfully!");
  log("");
  log("Next steps:");
  log(`  cd ${APEX_DIR}        ${colors.dim}# Navigate to the APEX directory${colors.reset}`);
  log(`  apex                  ${colors.dim}# Start the terminal UI${colors.reset}`);
  log("");
}
function update() {
  if (!isApexInstalled()) {
    error("APEX is not installed yet.");
    log("Run `apex setup` to install it first.");
    process.exit(1);
  }
  if (!checkCommand("bun")) {
    error("bun is required but not found in PATH.");
    log("Install Bun first: https://bun.sh/docs/installation");
    process.exit(1);
  }
  log("Updating APEX...");
  const pullResult = exec("git", ["pull"], APEX_DIR);
  if (pullResult !== 0) {
    error("Failed to pull latest changes.");
    process.exit(1);
  }
  const buildResult = buildApex();
  if (buildResult !== 0) {
    process.exit(1);
  }
  success("APEX updated successfully!");
}
function dev() {
  if (!isApexInstalled()) {
    error("APEX is not installed yet.");
    log("Run `apex setup` to install it first.");
    process.exit(1);
  }
  log("Starting APEX terminal UI...");
  const binaryPath = getBinaryPath();
  if (!fs.existsSync(binaryPath)) {
    error("APEX binary not found.");
    log("Run `apex update` to build it.");
    process.exit(1);
  }
  if (isWindows()) {
    exec(path.join(APEX_DIR, "apex.cmd"), [], APEX_DIR);
  } else {
    exec("bash", [path.join(APEX_DIR, "apex")], APEX_DIR);
  }
}
function uninstall() {
  if (!fs.existsSync(APEX_DIR)) {
    warn("APEX is not installed.");
    process.exit(0);
  }
  log("");
  warn(`This will remove APEX from ${APEX_DIR}`);
  log("");
  if (isWindows()) {
    const result = execQuiet("rmdir", ["/s", "/q", APEX_DIR]);
    if (result.status !== 0) {
      error("Failed to remove APEX directory.");
      process.exit(1);
    }
  } else {
    const result = execQuiet("rm", ["-rf", APEX_DIR]);
    if (result.status !== 0) {
      error("Failed to remove APEX directory.");
      process.exit(1);
    }
  }
  success("APEX uninstalled successfully!");
  log("");
  log("To completely remove the CLI, run:");
  log("  npm uninstall -g @apex-code/apex");
  log("");
}
function showHelp() {
  log(`${colors.cyan}APEX Protocol CLI${colors.reset}`);
  log("");
  log("Commands:");
  log(`  setup      Install APEX into ~/.config/apex (one-time)`);
  log(`  update     Pull latest changes and rebuild the APEX binary`);
  log(`  dev        Start the APEX terminal UI`);
  log(`  uninstall  Remove APEX from ~/.config/apex`);
  log(`  help       Show this help message`);
  log("");
  log(`Current install directory: ${APEX_DIR}`);
  log(`Installed: ${isApexInstalled() ? "yes" : "no"}`);
  log("");
}
var rawCommand = process.argv[2];
var command = rawCommand ?? (isApexInstalled() ? "dev" : "help");
switch (command) {
  case "setup":
    setup();
    break;
  case "update":
    update();
    break;
  case "dev":
    dev();
    break;
  case "uninstall":
    uninstall();
    break;
  case "help":
  case "--help":
  case "-h":
    showHelp();
    break;
  default:
    error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
