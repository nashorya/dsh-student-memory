const LESSON_CITATION = `RECALL CITATION RULE:
- Recalled items have stable IDs.
- If a card materially informs an action, cite [[used_recall:<id>]].
- Do not cite an item merely because it was shown.`;
function firstSentence(text) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^.+?[。.!？?]/u);
  return (match?.[0] ?? trimmed.split("\n")[0] ?? trimmed).trim();
}
function renderLessonCard(item) {
  return `- [${item.id}] ${item.summary.trim()}`;
}
function renderL1(input = {}) {
  const spec = [];
  if (input.goal?.trim()) spec.push(`Goal: ${input.goal.trim()}`);
  if (input.phase?.trim()) spec.push(`Phase: ${input.phase.trim()}`);
  if (input.currentStep?.trim()) spec.push(`Current step: ${input.currentStep.trim()}`);
  const parts = [];
  if (input.adrRequired || !input.goal?.trim()) {
    parts.push("### adrRequired\n\u672C\u8BF7\u6C42\u8FD8\u6CA1\u6709 ADR\u3002\u5148\u8C03\u7528 propose_adr\uFF0C\u518D\u5B9E\u65BD\u3002");
  }
  if (spec.length > 0) parts.push(`### taskSpec
${spec.join("\n")}`);
  const hard = input.hardConstraints?.trim();
  if (hard) parts.push(`### hardConstraints
HARD CONSTRAINTS:
${hard}`);
  const summary = input.l2Summary?.trim();
  if (summary) parts.push(`### l2Summary
${summary}`);
  const arcs = (input.openArcs ?? []).filter((id) => id.trim().length > 0);
  if (arcs.length > 0 || input.harvest?.trim()) {
    const lines = [...arcs.map((id) => `- ${id}`)];
    if (input.harvest?.trim()) lines.push(input.harvest.trim());
    parts.push(`### openArcs
${lines.join("\n")}`);
  }
  const lessons = (input.lessons ?? []).filter((item) => item.summary.trim().length > 0);
  if (lessons.length > 0) {
    parts.push(`### lessons
${LESSON_CITATION}
${lessons.map(renderLessonCard).join("\n")}`);
  }
  return parts.join("\n\n");
}
export {
  firstSentence,
  renderL1,
  renderLessonCard
};
