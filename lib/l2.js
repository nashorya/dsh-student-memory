function renderL2Summary(pinned, board = {}) {
  const parts = [];
  const wm = pinned.workingMemory?.trim();
  if (wm) parts.push(`workingMemory:
${wm}`);
  const ledger = pinned.taskLedger?.trim();
  if (ledger) parts.push(`taskLedger:
${ledger}`);
  const doingStage = (board.stages ?? []).find((stage) => stage.status === "doing");
  const stageTodos = (board.todos ?? []).filter((todo) => {
    if (doingStage) return todo.stageId === doingStage.id && todo.status !== "done";
    return todo.status !== "done";
  });
  if (stageTodos.length > 0) {
    const heading = doingStage ? `stage ${doingStage.title}` : "todolist";
    parts.push(`${heading}:
${stageTodos.map((todo) => `- [${todo.status}] ${todo.content}`).join("\n")}`);
  }
  const errors = (pinned.recentErrors ?? []).map((line) => line.trim()).filter(Boolean);
  if (errors.length > 0) {
    parts.push(`recentErrors:
${errors.map((line) => `- ${line}`).join("\n")}`);
  }
  return parts.join("\n\n");
}
function renderL2(pinned, board = {}) {
  return renderL2Summary(pinned, board);
}
export {
  renderL2,
  renderL2Summary
};
