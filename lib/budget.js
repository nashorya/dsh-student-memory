import { L1_CONTEXT } from "./types.js";
function truncateL1(text, maxChars, layer = "L1") {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}

[student-memory: ${layer} truncated to ${maxChars} chars]`;
}
function applyL1Budget(assembly, maxChars) {
  if (!assembly) return { sections: [], contexts: [] };
  const contexts = assembly.contexts ?? [];
  return {
    ...assembly,
    contexts: contexts.map((entry) => {
      if (entry.name !== L1_CONTEXT) return entry;
      return { ...entry, text: truncateL1(entry.text, maxChars) };
    })
  };
}
export {
  applyL1Budget,
  truncateL1
};
