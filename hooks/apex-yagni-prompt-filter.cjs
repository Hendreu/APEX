#!/usr/bin/env node
// apex-yagni — UserPromptSubmit hook
// Detects /apex-yagni commands and updates the active mode.

const fs = require("fs");
const path = require("path");
const os = require("os");

const MODE_DIR = path.join(os.homedir(), ".apex");
const MODE_FILE = path.join(MODE_DIR, "yagni-mode");
const VALID_MODES = ["off", "lite", "full", "ultra", "review"];
const DEFAULT_MODE = "full";

function readMode() {
  try {
    const mode = fs.readFileSync(MODE_FILE, "utf8").trim();
    return VALID_MODES.includes(mode) ? mode : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

function writeMode(mode) {
  fs.mkdirSync(MODE_DIR, { recursive: true });
  fs.writeFileSync(MODE_FILE, mode);
}

function writeOutput(mode, message) {
  const payload = { mode, message };
  process.stdout.write(JSON.stringify(payload));
}

let input = "";
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input.replace(/^\uFEFF/, ""));
    const prompt = (data.prompt || "").trim().toLowerCase();
    const parts = prompt.split(/\s+/);
    const cmd = parts[0].replace(/^[@$]/, "/");
    const arg = parts[1] || "";

    let mode = null;

    if (cmd === "/apex-yagni-review") {
      mode = "review";
    } else if (cmd === "/apex-yagni-audit") {
      mode = "review";
    } else if (cmd === "/apex-yagni") {
      if (VALID_MODES.includes(arg)) {
        mode = arg;
      } else {
        mode = readMode();
      }
    } else if (cmd === "/apex-yagni-off") {
      mode = "off";
    }

    if (mode !== null) {
      writeMode(mode);
      if (mode === "off") {
        writeOutput(mode, "APEX YAGNI mode off");
      } else {
        writeOutput(mode, `APEX YAGNI mode: ${mode}`);
      }
    }
  } catch {
    // Silent fail — don't block prompt submission.
  }
});
