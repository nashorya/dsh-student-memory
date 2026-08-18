function openTurnOf(events) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event) continue;
    if (event.type === "turn/start") {
      return typeof event.data?.turn === "number" ? event.data.turn : null;
    }
    if (event.type === "turn/end") return null;
  }
  return null;
}
function selectPriorTurnRange(events, surfaceNodes) {
  if (surfaceNodes.length === 0) return null;
  let turnStartSeq;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event) continue;
    if (event.type === "turn/start") {
      turnStartSeq = event.seq;
      break;
    }
    if (event.type === "turn/end") return null;
  }
  if (turnStartSeq === void 0) return null;
  const keepFrom = surfaceNodes.findIndex((seq) => seq >= turnStartSeq);
  const shadowedSeqs = keepFrom === -1 ? [...surfaceNodes] : surfaceNodes.slice(0, keepFrom);
  if (shadowedSeqs.length === 0) return null;
  return {
    start: shadowedSeqs[0],
    end: shadowedSeqs[shadowedSeqs.length - 1],
    shadowedSeqs
  };
}
export {
  openTurnOf,
  selectPriorTurnRange
};
