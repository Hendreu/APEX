import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js"
import { useTheme } from "../context/theme"
import { useKV } from "../context/kv"
import type { JSX } from "@opentui/solid"
import type { RGBA } from "@opentui/core"
import type { ColorGenerator } from "opentui-spinner"

export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

export function Spinner(props: {
  children?: JSX.Element
  color?: RGBA | ColorGenerator
  frames?: string[]
  interval?: number
}) {
  const { theme } = useTheme()
  const kv = useKV()
  const interval = () => props.interval ?? 80
  const frames = () => props.frames ?? SPINNER_FRAMES
  const [index, setIndex] = createSignal(0)
  let timer: ReturnType<typeof setInterval> | undefined

  const cells = createMemo(() => {
    const text = frames()[index() % frames().length]
    if (!text) return []
    const totalFrames = frames().length
    const totalChars = text.length
    const color = props.color ?? theme.textMuted
    return Array.from(text).map((char, charIndex) => ({
      char,
      fg: typeof color === "function" ? color(index(), charIndex, totalFrames, totalChars) : color,
    }))
  })

  onMount(() => {
    timer = setInterval(() => setIndex((i) => (i + 1) % frames().length), interval())
  })

  onCleanup(() => {
    if (timer) clearInterval(timer)
  })

  return (
    <Show when={kv.get("animations_enabled", true)} fallback={<text fg={typeof props.color === "function" ? theme.textMuted : props.color ?? theme.textMuted}>⋯ {props.children}</text>}>
      <box flexDirection="row" gap={1}>
        <box flexDirection="row">
          <For each={cells()}>
            {(cell) => (
              <text fg={cell.fg} selectable={false}>
                {cell.char}
              </text>
            )}
          </For>
        </box>
        <Show when={props.children}>
          <text fg={typeof props.color === "function" ? theme.textMuted : props.color ?? theme.textMuted}>{props.children}</text>
        </Show>
      </box>
    </Show>
  )
}
