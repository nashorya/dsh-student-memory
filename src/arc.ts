export type ArcSignal = 'tool-error' | 'tests-green' | 'tsc-ci'

export interface ToolObservation {
  toolCallId: string
  toolName: string
  isError: boolean
  argsText?: string
  resultText?: string
}

export interface Arc {
  arcId: string
  openedBy: string
  signals: ArcSignal[]
  consumed: boolean
}

const TEST_RE = /vitest|pytest|npm test|pnpm test|yarn test|cargo test|go test|jest|mocha|npx test/i
const TSC_RE = /\btsc\b|typecheck|eslint|ci passed|github actions/i

export function classifyObservation(obs: ToolObservation): ArcSignal | 'neutral' {
  const blob = `${obs.toolName} ${obs.argsText ?? ''} ${obs.resultText ?? ''}`
  if (obs.isError) return 'tool-error'
  if (TEST_RE.test(blob) || /test/.test(obs.toolName.toLowerCase())) return 'tests-green'
  if (TSC_RE.test(blob)) return 'tsc-ci'
  return 'neutral'
}

export function nextArcId(n: number): string {
  return `arc_${n.toString(36)}`
}

export function applyObservation(arcs: Arc[], obs: ToolObservation, nextId: () => string): Arc[] {
  const kind = classifyObservation(obs)
  if (kind === 'neutral') return arcs
  if (kind === 'tool-error') {
    return [...arcs, {
      arcId: nextId(),
      openedBy: obs.toolCallId,
      signals: ['tool-error'],
      consumed: false,
    }]
  }
  const open = [...arcs].reverse().find((arc) => !arc.consumed && arc.signals.includes('tool-error'))
  if (!open) return arcs
  if (open.signals.includes(kind)) return arcs
  return arcs.map((arc) => arc.arcId === open.arcId
    ? { ...arc, signals: [...arc.signals, kind] }
    : arc)
}

export function openArcs(arcs: readonly Arc[]): Arc[] {
  return arcs.filter((arc) => !arc.consumed)
}
