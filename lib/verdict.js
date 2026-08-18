function verdictOf(signals) {
  if (signals.includes("tests-green")) return "tests-green";
  if (signals.includes("tsc-ci")) return "tsc-ci";
  return "isolated";
}
export {
  verdictOf
};
