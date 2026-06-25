#!/usr/bin/env node
import { spawnSync } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"

const REPO_URL = "https://github.com/Hendreu/APEX.git"
const APEX_DIR = path.join(os.homedir(), ".config", "apex")

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
}

function log(message: string) {
  console.log(message)
}

function success(message: string) {
  console.log(`${colors.green}${message}${colors.reset}`)
}

function warn(message: string) {
  console.log(`${colors.yellow}${message}${colors.reset}`)
}

function error(message: string) {
  console.log(`${colors.red}${message}${colors.reset}`)
}

function dim(message: string) {
  console.log(`${colors.dim}${message}${colors.reset}`)
}

function exec(command: string, args: string[], cwd?: string) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  })
  return result.status ?? 1
}

function execQuiet(command: string, args: string[], cwd?: string) {
  return spawnSync(command, args, { cwd, shell: process.platform === "win32" })
}

function checkCommand(cmd: string): boolean {
  const result = execQuiet(process.platform === "win32" ? "where" : "which", [cmd])
  return result.status === 0
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function isApexInstalled(): boolean {
  return fs.existsSync(APEX_DIR) && fs.existsSync(path.join(APEX_DIR, ".git"))
}

function isWindows(): boolean {
  return process.platform === "win32"
}

function getPlatform(): string {
  switch (process.platform) {
    case "darwin": return "darwin"
    case "linux": return "linux"
    case "win32": return "windows"
    default: return process.platform
  }
}

function getArch(): string {
  switch (process.arch) {
    case "x64": return "x64"
    case "arm64": return "arm64"
    case "arm": return "arm"
    default: return process.arch
  }
}

function downloadApexBinary(): number {
  const platform = getPlatform()
  const arch = getArch()
  const base = `apex-${platform}-${arch}`
  const targetDir = path.join(APEX_DIR, "packages", "opencode", "dist-restored", base, "bin")
  const targetBinary = path.join(targetDir, platform === "windows" ? "apex.exe" : "apex")

  if (fs.existsSync(targetBinary)) {
    log("Binary already exists, skipping download.")
    return 0
  }

  const tempDir = path.join(os.tmpdir(), `apex-install-${Date.now()}`)
  ensureDir(tempDir)

  const archiveExt = platform === "linux" ? ".tar.gz" : ".zip"
  const filename = `opencode-${platform}-${arch}${archiveExt}`
  const url = `https://github.com/anomalyco/opencode/releases/latest/download/${filename}`
  const downloadPath = path.join(tempDir, filename)

  log(`Downloading from ${url}...`)

  const downloadResult = execQuiet("curl", ["-fsSL", "-o", downloadPath, url])
  if (downloadResult.status !== 0) {
    error("Failed to download binary.")
    return 1
  }

  log("Extracting binary...")

  let extractResult
  if (platform === "linux") {
    extractResult = execQuiet("tar", ["-xzf", downloadPath, "-C", tempDir])
  } else {
    extractResult = execQuiet("unzip", ["-q", downloadPath, "-d", tempDir])
  }

  if (extractResult.status !== 0) {
    error("Failed to extract binary.")
    return 1
  }

  const extractedBinary = path.join(tempDir, platform === "windows" ? "opencode.exe" : "opencode")
  if (!fs.existsSync(extractedBinary)) {
    error("Binary not found in archive.")
    return 1
  }

  ensureDir(targetDir)
  fs.copyFileSync(extractedBinary, targetBinary)

  if (!isWindows()) {
    fs.chmodSync(targetBinary, 0o755)
  }

  fs.rmSync(tempDir, { recursive: true, force: true })

  success("Binary downloaded successfully!")
  return 0
}

function setup() {
  log("")
  log(`${colors.cyan}APEX Protocol Installer${colors.reset}`)
  log(dim("━".repeat(40)))
  log("")

  if (!checkCommand("git")) {
    error("git is required but not found in PATH.")
    log("Install git and try again: https://git-scm.com/downloads")
    process.exit(1)
  }

  if (!checkCommand("bun")) {
    warn("bun is required but not found in PATH.")
    log("Install Bun first: https://bun.sh/docs/installation")
    process.exit(1)
  }

  if (isWindows()) {
    warn("Windows detected: some native dependencies require build tools.")
    log("If installation fails, install Visual Studio Build Tools with C++ workload:")
    log("https://aka.ms/vs/17/release/vs_BuildTools.exe")
    log("")
  }

  if (isApexInstalled()) {
    warn(`APEX is already installed at ${APEX_DIR}`)
    log("Run `apex update` to pull the latest changes, or `apex dev` to start.")
    process.exit(0)
  }

  log(`Installing APEX into ${APEX_DIR}...`)
  ensureDir(path.dirname(APEX_DIR))

  const cloneResult = exec("git", ["clone", REPO_URL, APEX_DIR])
  if (cloneResult !== 0) {
    error("Failed to clone the APEX repository.")
    process.exit(1)
  }

  log("")
  log("Installing dependencies with bun...")
  const installResult = exec("bun", ["install"], APEX_DIR)
  if (installResult !== 0) {
    error("Failed to install dependencies.")
    if (isWindows()) {
      log("")
      log("This usually means Visual Studio Build Tools are missing.")
      log("Download and install: https://aka.ms/vs/17/release/vs_BuildTools.exe")
      log("Make sure to select 'Desktop development with C++' workload.")
      log("")
      log("After installing, run: apex update")
    }
    process.exit(1)
  }

  log("")
  log("Downloading APEX binary...")
  const binaryResult = downloadApexBinary()
  if (binaryResult !== 0) {
    warn("Failed to download APEX binary.")
    log("You can still use APEX by running the source directly.")
    log("To retry later, run: apex update")
  }

  log("")
  success("APEX installed successfully!")
  log("")
  log("Next steps:")
  log(`  cd ${APEX_DIR}        ${colors.dim}# Navigate to the APEX directory${colors.reset}`)
  log(`  apex dev              ${colors.dim}# Start the terminal UI${colors.reset}`)
  log("")
}

function update() {
  if (!isApexInstalled()) {
    error("APEX is not installed yet.")
    log("Run `apex setup` to install it first.")
    process.exit(1)
  }

  log("Updating APEX...")
  const pullResult = exec("git", ["pull"], APEX_DIR)
  if (pullResult !== 0) {
    error("Failed to pull latest changes.")
    process.exit(1)
  }

  log("Re-installing dependencies...")
  const installResult = exec("bun", ["install"], APEX_DIR)
  if (installResult !== 0) {
    error("Failed to install dependencies.")
    process.exit(1)
  }

  log("Updating APEX binary...")
  const binaryResult = downloadApexBinary()
  if (binaryResult !== 0) {
    warn("Failed to update binary, but source is up to date.")
  }

  success("APEX updated successfully!")
}

function dev() {
  if (!isApexInstalled()) {
    error("APEX is not installed yet.")
    log("Run `apex setup` to install it first.")
    process.exit(1)
  }

  log("Starting APEX terminal UI...")
  if (isWindows()) {
    exec(path.join(APEX_DIR, "apex.cmd"), [], APEX_DIR)
  } else {
    exec("bash", [path.join(APEX_DIR, "apex")], APEX_DIR)
  }
}

function uninstall() {
  if (!isApexInstalled()) {
    warn("APEX is not installed.")
    process.exit(0)
  }

  log("")
  warn(`This will remove APEX from ${APEX_DIR}`)
  log("")

  if (isWindows()) {
    const result = execQuiet("rmdir", ["/s", "/q", APEX_DIR])
    if (result.status !== 0) {
      error("Failed to remove APEX directory.")
      process.exit(1)
    }
  } else {
    const result = execQuiet("rm", ["-rf", APEX_DIR])
    if (result.status !== 0) {
      error("Failed to remove APEX directory.")
      process.exit(1)
    }
  }

  success("APEX uninstalled successfully!")
  log("")
  log("To completely remove the CLI, run:")
  log("  npm uninstall -g @apex-code/apex")
  log("")
}

function showHelp() {
  log(`${colors.cyan}APEX Protocol CLI${colors.reset}`)
  log("")
  log("Commands:")
  log(`  setup      Install APEX into ~/.config/apex (one-time)`)
  log(`  update     Pull latest changes and re-install dependencies`)
  log(`  dev        Start the APEX terminal UI`)
  log(`  uninstall  Remove APEX from ~/.config/apex`)
  log(`  help       Show this help message`)
  log("")
  log(`Current install directory: ${APEX_DIR}`)
  log(`Installed: ${isApexInstalled() ? "yes" : "no"}`)
  log("")
}

const rawCommand = process.argv[2]

const command = rawCommand ?? (isApexInstalled() ? "dev" : "help")

switch (command) {
  case "setup":
    setup()
    break
  case "update":
    update()
    break
  case "dev":
    dev()
    break
  case "uninstall":
    uninstall()
    break
  case "help":
  case "--help":
  case "-h":
    showHelp()
    break
  default:
    error(`Unknown command: ${command}`)
    showHelp()
    process.exit(1)
}