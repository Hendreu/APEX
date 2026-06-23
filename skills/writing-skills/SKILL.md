#!/usr/bin/env bash
# Codex SessionStart hook for APEX plugin

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

using_APEX_content=$(cat "${PLUGIN_ROOT}/skills/using-apex/SKILL.md" 2>&1 || echo "Error reading using-apex skill")

escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

using_APEX_escaped=$(escape_for_json "$using_APEX_content")
session_context="<EXTREMELY_IMPORTANT>\nYou have APEX.\n\n**Below is the full content of your 'APEX:using-apex' skill - your introduction to using skills. For all other skills, follow the Codex skill-loading instructions in that skill:**\n\n${using_APEX_escaped}\n</EXTREMELY_IMPORTANT>"

printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context" | cat

exit 0
