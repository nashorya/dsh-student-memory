import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
const BOARD_DIR_NAME = ".dsh-student-memory";
const INDEX_FILE = "INDEX.md";
const ADR_FILE = "ADR.md";
const BUGLOG_FILE = "buglog.md";
const INDEX_STUB = `# Index

## ADR

\uFF08\u8FD8\u6CA1\u6709\uFF09

## Buglog

\uFF08\u8FD8\u6CA1\u6709\uFF09

## Status

\u672A\u5F00\u59CB
`;
const ADR_STUB = `# ADR

\u6309\u65F6\u95F4\u5012\u5E8F\u8BB0\u5F55\u672C\u5DE5\u4F5C\u533A\u7684\u51B3\u7B56\u3002\u6BCF\u6761\u8BF7\u6C42\u6216\u89C4\u5212\u5FC5\u987B\u5148\u6709 ADR\u3002
`;
const BUGLOG_STUB = `# Buglog

\u6309\u65F6\u95F4\u5012\u5E8F\u8BB0\u5F55\u7F3A\u9677\u4E0E\u4FEE\u590D\u3002
`;
function boardDir(workspaceDir) {
  return join(workspaceDir, BOARD_DIR_NAME);
}
function docPaths(workspaceDir) {
  const dir = boardDir(workspaceDir);
  return {
    index: join(dir, INDEX_FILE),
    adr: join(dir, ADR_FILE),
    buglog: join(dir, BUGLOG_FILE),
    lessons: join(dir, "lessons.json"),
    dashboard: join(dir, "dashboard.html")
  };
}
async function readOr(path, fallback) {
  try {
    return await readFile(path, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}
async function loadWorkspaceDocs(workspaceDir) {
  const paths = docPaths(workspaceDir);
  await mkdir(boardDir(workspaceDir), { recursive: true });
  const docs = {
    index: await readOr(paths.index, INDEX_STUB),
    adr: await readOr(paths.adr, ADR_STUB),
    buglog: await readOr(paths.buglog, BUGLOG_STUB)
  };
  await Promise.all([
    writeFile(paths.index, docs.index, "utf8"),
    writeFile(paths.adr, docs.adr, "utf8"),
    writeFile(paths.buglog, docs.buglog, "utf8")
  ]);
  return docs;
}
async function writeIndex(workspaceDir, content) {
  const paths = docPaths(workspaceDir);
  await mkdir(boardDir(workspaceDir), { recursive: true });
  await writeFile(paths.index, content.trimEnd() + "\n", "utf8");
}
async function writeAdrDoc(workspaceDir, content) {
  const paths = docPaths(workspaceDir);
  await mkdir(boardDir(workspaceDir), { recursive: true });
  await writeFile(paths.adr, content.trimEnd() + "\n", "utf8");
}
async function prependAdr(workspaceDir, entry) {
  const paths = docPaths(workspaceDir);
  await mkdir(boardDir(workspaceDir), { recursive: true });
  const current = await readOr(paths.adr, ADR_STUB);
  const rest = current.replace(/^# ADR\s*/, "").trimStart();
  const next = `# ADR

${entry.trim()}
${rest ? `
${rest}` : ""}
`;
  await writeFile(paths.adr, next, "utf8");
  return next;
}
async function prependBuglog(workspaceDir, entry) {
  const paths = docPaths(workspaceDir);
  await mkdir(boardDir(workspaceDir), { recursive: true });
  const current = await readOr(paths.buglog, BUGLOG_STUB);
  const rest = current.replace(/^# Buglog\s*/, "").trimStart();
  const next = `# Buglog

${entry.trim()}
${rest ? `
${rest}` : ""}
`;
  await writeFile(paths.buglog, next, "utf8");
  return next;
}
function formatAdrEntry(input) {
  const decision = input.decision?.trim() || "\u5F85\u5B9E\u65BD";
  return [
    `## ${input.id} \xB7 ${input.title}`,
    "",
    `- \u72B6\u6001: ${input.status}`,
    `- \u65F6\u95F4: ${input.at}`,
    `- \u80CC\u666F: ${input.context.trim()}`,
    `- \u51B3\u7B56: ${decision}`,
    ""
  ].join("\n");
}
function formatBugEntry(input) {
  return [
    `## ${input.at} \xB7 ${input.title}`,
    "",
    `- \u72B6\u6001: ${input.status}`,
    "",
    input.detail.trim(),
    ""
  ].join("\n");
}
export {
  ADR_FILE,
  BOARD_DIR_NAME,
  BUGLOG_FILE,
  INDEX_FILE,
  boardDir,
  docPaths,
  formatAdrEntry,
  formatBugEntry,
  loadWorkspaceDocs,
  prependAdr,
  prependBuglog,
  writeAdrDoc,
  writeIndex
};
