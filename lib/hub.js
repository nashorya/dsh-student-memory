import { resolve } from "node:path";
import { FilePersist, MemoryPersist } from "./persist.js";
import { StudentMemoryRuntime } from "./runtime.js";
import { docPaths } from "./docs.js";
class MemoryHub {
  constructor(base = {}) {
    this.base = base;
  }
  base;
  boards = /* @__PURE__ */ new Map();
  booting = /* @__PURE__ */ new Map();
  activeCwd = "";
  use(workspaceDir) {
    const key = resolve(workspaceDir);
    this.activeCwd = key;
    const existing = this.boards.get(key);
    if (existing) return existing;
    const paths = docPaths(key);
    const persist = this.base.persist === "memory" ? new MemoryPersist() : new FilePersist(paths.lessons);
    const runtime = new StudentMemoryRuntime(persist, {
      ...this.base,
      workspaceDir: key,
      storePath: paths.lessons,
      dashboardPath: paths.dashboard
    });
    this.booting.set(key, runtime.boot());
    console.info(`[student-memory] ${paths.dashboard}`);
    this.boards.set(key, runtime);
    return runtime;
  }
  async ready(workspaceDir) {
    const runtime = this.use(workspaceDir);
    await this.booting.get(resolve(workspaceDir));
    return runtime;
  }
  active() {
    if (!this.activeCwd) return void 0;
    return this.boards.get(this.activeCwd);
  }
  get(workspaceDir) {
    return this.boards.get(resolve(workspaceDir));
  }
  list() {
    return [...this.boards.entries()].map(([cwd, runtime]) => ({ cwd, runtime }));
  }
}
export {
  MemoryHub
};
