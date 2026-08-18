const TRUST_LINE = {
  "tests-green": "\u6709\u6D4B\u8BD5\u8F6C\u7EFF\u80CC\u4E66",
  "tsc-ci": "\u6709 tsc/CI \u901A\u8FC7\u80CC\u4E66",
  isolated: "\u8FD8\u5728\u9694\u79BB\u533A"
};
function usedRecallIds(text) {
  return [...text.matchAll(/\[\[used_recall:([^\]]+)\]\]/g)].map((match) => match[1]).filter(Boolean);
}
function renderReceipt(lessons, used = []) {
  const learned = lessons.length === 0 ? "\u8FD9\u6B21\u6CA1\u6709\u8BB0\u4E0B\u65B0\u7684 lesson\u3002" : `\u8FD9\u6B21\u6211\u5B66\u5230\u4E86\u8FD9 ${lessons.length} \u6761\uFF1A
${lessons.map((lesson) => `- ${lesson.id}: ${TRUST_LINE[lesson.trust]}`).join("\n")}`;
  const usedLine = used.length === 0 ? "\u6CA1\u6709\u8BB0\u5230\u7528\u4E0A\u54EA\u6761\u65E7\u7ECF\u9A8C\u3002" : `\u7528\u4E0A\u4E86\uFF1A
${used.map((id) => `- ${id}`).join("\n")}`;
  return `${learned}
${usedLine}`;
}
function renderSidebar(input) {
  const injected = input.injected.length === 0 ? "\u672C\u62CD\u6CA1\u6709\u644A\u5F00 lesson \u5361\u7247\u3002" : `\u672C\u62CD\u5361\u7247\uFF1A
${input.injected.map((id) => `- ${id}`).join("\n")}`;
  return `${injected}

${renderReceipt(input.learned, input.used ?? [])}`;
}
export {
  renderReceipt,
  renderSidebar,
  usedRecallIds
};
