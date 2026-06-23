#!/usr/bin/env node
// apex-yagni — SessionStart activation hook
// Emits the apex-yagni ruleset as additional context.

const fs = require("fs");
const path = require("path");

const DEFAULT_MODE = process.env.APEX_YAGNI_MODE || "full";
const VALID_MODES = ["off", "lite", "full", "ultra", "review"];

function writeOutput(mode, context) {
  const payload = {
    additionalContext: context,
    mode,
  };
  process.stdout.write(JSON.stringify(payload));
}

function getRuleset(mode) {
  if (mode === "off") return "";
  const skillPath = path.join(__dirname, "..", "skills", "apex-yagni", "SKILL.md");
  try {
    return fs.readFileSync(skillPath, "utf8");
  } catch (err) {
    return `apex-yagni ruleset unavailable: ${err.message}`;
  }
}

function main() {
  const mode = VALID_MODES.includes(DEFAULT_MODE) ? DEFAULT_MODE : "full";
  const rules = getRuleset(mode);
  writeOutput(mode, rules);
}

main();
