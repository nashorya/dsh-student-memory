import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
const empty = () => ({ lessons: [], adrs: [], stages: [], todos: [], pinned: {}, archivedKey: "" });
function withStageId(todos) {
  return todos.map((todo) => ({
    ...todo,
    stageId: todo.stageId ?? ""
  }));
}
class MemoryPersist {
  constructor(state = empty()) {
    this.state = state;
  }
  state;
  async load() {
    return {
      lessons: [...this.state.lessons],
      adrs: [...this.state.adrs],
      stages: [...this.state.stages],
      todos: withStageId(this.state.todos),
      pinned: { ...this.state.pinned },
      archivedKey: this.state.archivedKey ?? ""
    };
  }
  async save(state) {
    this.state = {
      lessons: [...state.lessons],
      adrs: [...state.adrs],
      stages: [...state.stages],
      todos: withStageId(state.todos),
      pinned: { ...state.pinned },
      archivedKey: state.archivedKey ?? ""
    };
  }
}
class FilePersist {
  constructor(path) {
    this.path = path;
  }
  path;
  async load() {
    try {
      const raw = await readFile(this.path, "utf8");
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return empty();
      return {
        lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
        adrs: Array.isArray(parsed.adrs) ? parsed.adrs : [],
        stages: Array.isArray(parsed.stages) ? parsed.stages : [],
        todos: withStageId(Array.isArray(parsed.todos) ? parsed.todos : []),
        pinned: parsed.pinned && typeof parsed.pinned === "object" ? parsed.pinned : {},
        archivedKey: typeof parsed.archivedKey === "string" ? parsed.archivedKey : ""
      };
    } catch (err) {
      if (err.code === "ENOENT") return empty();
      throw err;
    }
  }
  async save(state) {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, `${JSON.stringify(state, null, 2)}
`, "utf8");
  }
}
export {
  FilePersist,
  MemoryPersist
};
