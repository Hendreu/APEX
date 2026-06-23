import { RGBA } from "@opentui/core"
import { For } from "solid-js"
import {
  APEX_HALFROWS,
  APEX_HALFROWS_HEIGHT,
  APEX_HALFROWS_WIDTH,
  type HalfCell,
} from "../generated/apex-halfblocks"

function cellColor(color: readonly [number, number, number] | undefined) {
  if (!color) return undefined
  return RGBA.fromInts(color[0], color[1], color[2])
}

function HalfBlockCell(props: { cell: HalfCell }) {
  return (
    <text fg={cellColor(props.cell.fg)} bg={cellColor(props.cell.bg)} selectable={false}>
      {props.cell.char}
    </text>
  )
}

export function HalfBlockLogo() {
  return (
    <box flexDirection="column" width={APEX_HALFROWS_WIDTH} height={APEX_HALFROWS_HEIGHT}>
      <For each={APEX_HALFROWS}>
        {(row) => (
          <box flexDirection="row" width={APEX_HALFROWS_WIDTH} height={1}>
            <For each={row}>{(cell) => <HalfBlockCell cell={cell} />}</For>
          </box>
        )}
      </For>
    </box>
  )
}
