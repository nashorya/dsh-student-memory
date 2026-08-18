function renderLesson(lesson) {
  const cause = lesson.cause.trim();
  const fix = lesson.fixPattern.trim();
  if (!cause || !fix) return "";
  const lines = [`Cause: ${cause}`, `Fix: ${fix}`];
  const contrast = lesson.contrast.trim();
  if (contrast) lines.push(`Contrast: ${contrast}`);
  const boundary = lesson.doNotApplyWhen.trim();
  if (boundary) lines.push(`Do not apply when: ${boundary}`);
  return lines.join("\n");
}
function lessonWatermark(id) {
  return `\u27E6sm:${id}\u27E7`;
}
function createLesson(draft, trust, now = /* @__PURE__ */ new Date()) {
  const id = `lesson_${now.getTime().toString(36)}`;
  return {
    id,
    arcId: draft.arcId,
    cause: draft.cause.trim(),
    fixPattern: draft.fixPattern.trim(),
    contrast: draft.contrast.trim(),
    doNotApplyWhen: draft.doNotApplyWhen.trim(),
    trust,
    status: trust === "isolated" ? "isolated" : "promoted",
    watermark: lessonWatermark(id),
    createdAt: now.toISOString()
  };
}
export {
  createLesson,
  lessonWatermark,
  renderLesson
};
