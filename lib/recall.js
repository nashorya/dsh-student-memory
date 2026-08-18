import { renderLesson } from "./lesson.js";
import { firstSentence } from "./l1.js";
function cardSummary(lesson) {
  const cause = firstSentence(lesson.cause);
  const boundary = lesson.doNotApplyWhen.trim();
  const lines = [cause];
  if (boundary) lines.push(`Do not apply when: ${boundary}`);
  lines.push(`trust: ${lesson.trust}`);
  return lines.join(" / ");
}
function lessonCards(lessons, sessionIds = []) {
  const session = new Set(sessionIds);
  return [...lessons].filter((lesson) => renderLesson(lesson).length > 0).sort((a, b) => {
    const aSession = session.has(a.id) ? 0 : 1;
    const bSession = session.has(b.id) ? 0 : 1;
    if (aSession !== bSession) return aSession - bSession;
    return b.createdAt.localeCompare(a.createdAt);
  }).map((lesson) => ({ id: lesson.id, summary: cardSummary(lesson) }));
}
function recallLessons(lessons, _query = "", _limit = 10) {
  return lessonCards(lessons);
}
export {
  cardSummary,
  lessonCards,
  recallLessons
};
