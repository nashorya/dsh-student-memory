const EXCLUDED_PLUGINS = [
  { id: "compaction-basic", names: ["@deepseek-ai/dsh-compaction-basic"] },
  { id: "command-compact", names: ["@deepseek-ai/dsh-command-compact"] }
];
function matchesExcluded(entry) {
  const id = entry.options?.id ?? entry.id ?? "";
  const name = entry.options?.name ?? "";
  return EXCLUDED_PLUGINS.some((item) => id === item.id || id.endsWith(`/${item.id}`) || item.names.includes(name));
}
async function excludeConflictingPlugins(ctx) {
  const loader = ctx.loader;
  if (!loader?.entries) return [];
  const disabled = [];
  for (const entry of loader.entries()) {
    if (!matchesExcluded(entry) || entry.disabled) continue;
    await entry.update({ disabled: true });
    disabled.push(entry.options?.id ?? entry.id ?? "");
  }
  return disabled;
}
export {
  EXCLUDED_PLUGINS,
  excludeConflictingPlugins,
  matchesExcluded
};
