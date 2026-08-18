const L0_SECTION = "student-memory:l0";
const L1_CONTEXT = "student-memory:l1";
const L0_ORDER = 50;
const L1_ORDER = 200;
const L1_SAFETY_CHARS = 12e3;
const DEFAULT_L1_BUDGET = L1_SAFETY_CHARS;
const CACHE_PREFIX_BREAKPOINT = "### cache_prefix_breakpoint\n# Static prefix ends; dynamic task context follows.";
export {
  CACHE_PREFIX_BREAKPOINT,
  DEFAULT_L1_BUDGET,
  L0_ORDER,
  L0_SECTION,
  L1_CONTEXT,
  L1_ORDER,
  L1_SAFETY_CHARS
};
