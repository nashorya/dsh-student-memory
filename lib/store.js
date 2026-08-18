class MemoryStore {
  pinned = {};
  nearField = {};
  recall = [];
  pin(next) {
    this.pinned = { ...next };
  }
  setNearField(next) {
    this.nearField = { ...next };
  }
  setRecall(next) {
    this.recall = [...next];
  }
}
export {
  MemoryStore
};
