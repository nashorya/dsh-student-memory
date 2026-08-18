const ERROR_TEXT_CHARS = 400;
const TEST_RE = /vitest|pytest|npm test|pnpm test|yarn test|cargo test|go test|jest|mocha|npx test/i;
const TSC_RE = /\btsc\b|typecheck|eslint|ci passed|github actions/i;
function classifyObservation(obs) {
  const blob = `${obs.toolName} ${obs.argsText ?? ""} ${obs.resultText ?? ""}`;
  if (obs.isError) return "tool-error";
  if (TEST_RE.test(blob) || /test/.test(obs.toolName.toLowerCase())) return "tests-green";
  if (TSC_RE.test(blob)) return "tsc-ci";
  return "neutral";
}
function nextArcId(n) {
  return `arc_${n.toString(36)}`;
}
function applyObservation(arcs, obs, nextId) {
  const kind = classifyObservation(obs);
  if (kind === "neutral") return arcs;
  if (kind === "tool-error") {
    const errorText = (obs.resultText ?? obs.argsText ?? "").slice(0, ERROR_TEXT_CHARS);
    return [...arcs, {
      arcId: nextId(),
      openedBy: obs.toolCallId,
      signals: ["tool-error"],
      consumed: false,
      ...errorText ? { errorText } : {}
    }];
  }
  const open = [...arcs].reverse().find((arc) => !arc.consumed && arc.signals.includes("tool-error"));
  if (!open) return arcs;
  if (open.signals.includes(kind)) return arcs;
  return arcs.map((arc) => arc.arcId === open.arcId ? { ...arc, signals: [...arc.signals, kind] } : arc);
}
function openArcs(arcs) {
  return arcs.filter((arc) => !arc.consumed);
}
export {
  ERROR_TEXT_CHARS,
  applyObservation,
  classifyObservation,
  nextArcId,
  openArcs
};
