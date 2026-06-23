import { EOL } from "os"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Schema } from "effect"

export class CancelledError extends Schema.TaggedErrorClass<CancelledError>()("UICancelledError", {}) {}

export const Style = {
  TEXT_HIGHLIGHT: "\x1b[96m",
  TEXT_HIGHLIGHT_BOLD: "\x1b[96m\x1b[1m",
  TEXT_DIM: "\x1b[90m",
  TEXT_DIM_BOLD: "\x1b[90m\x1b[1m",
  TEXT_NORMAL: "\x1b[0m",
  TEXT_NORMAL_BOLD: "\x1b[1m",
  TEXT_WARNING: "\x1b[93m",
  TEXT_WARNING_BOLD: "\x1b[93m\x1b[1m",
  TEXT_DANGER: "\x1b[91m",
  TEXT_DANGER_BOLD: "\x1b[91m\x1b[1m",
  TEXT_SUCCESS: "\x1b[92m",
  TEXT_SUCCESS_BOLD: "\x1b[92m\x1b[1m",
  TEXT_INFO: "\x1b[94m",
  TEXT_INFO_BOLD: "\x1b[94m\x1b[1m",
}

export function println(...message: string[]) {
  print(...message)
  process.stderr.write(EOL)
}

export function print(...message: string[]) {
  blank = false
  process.stderr.write(message.join(" "))
}

let blank = false
export function empty() {
  if (blank) return
  println("" + Style.TEXT_NORMAL)
  blank = true
}

function assetPath(...parts: string[]): string {
  const isBun = path.basename(process.execPath).toLowerCase().startsWith("bun")
  const base = isBun
    ? path.join(path.dirname(fileURLToPath(import.meta.url)), "../../assets")
    : path.join(path.dirname(process.execPath), "../assets")
  return path.join(base, ...parts)
}

function terminalSupportsSixel(): boolean {
  if (process.env.APEX_SPLASH_SIXEL === "1") return true
  if (process.env.APEX_SPLASH_SIXEL === "0") return false
  if (!process.stderr.isTTY) return false
  const term = process.env.TERM ?? ""
  if (term.includes("sixel")) return true
  const program = process.env.TERM_PROGRAM ?? ""
  if (["iTerm.app", "WezTerm", "Hyper", "ghostty", "Tabby"].includes(program)) return true
  // Windows Terminal supports Sixel from v1.22 onward. WT_SESSION exists in older
  // versions too, so require a version we can verify or explicit opt-in.
  if (process.env.WT_SESSION) {
    const version = process.env.WT_VERSION
    if (!version) return false
    const match = version.match(/^(\d+)\.(\d+)/)
    if (!match) return false
    const major = Number.parseInt(match[1]!, 10)
    const minor = Number.parseInt(match[2]!, 10)
    if (major > 1 || (major === 1 && minor >= 22)) return true
  }
  return false
}

export function sixelLogo(): string | undefined {
  const file = assetPath("apex.sixel")
  if (!fs.existsSync(file)) return undefined
  try {
    return fs.readFileSync(file, "utf8")
  } catch {
    return undefined
  }
}

export function logo(pad?: string) {
  if (!terminalSupportsSixel()) {
    error(
      "Your terminal does not support Sixel graphics. Use a Sixel-capable terminal (iTerm2, WezTerm, Windows Terminal 1.22+, ghostty) or set APEX_SPLASH_SIXEL=1 to force."
    )
    process.exit(1)
  }

  const sixel = sixelLogo()
  if (!sixel) {
    error("Sixel logo asset is missing.")
    process.exit(1)
  }

  return pad ? pad + sixel : sixel
}

export async function input(prompt: string): Promise<string> {
  const readline = require("readline")
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(prompt, (answer: string) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

export function error(message: string) {
  if (message.startsWith("Error: ")) {
    message = message.slice("Error: ".length)
  }
  println(Style.TEXT_DANGER_BOLD + "Error: " + Style.TEXT_NORMAL + message)
}

export function markdown(text: string): string {
  return text
}

export * as UI from "./ui"
