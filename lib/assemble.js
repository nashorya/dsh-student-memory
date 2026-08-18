import { renderL0 } from "./l0.js";
import { renderL1 } from "./l1.js";
import { renderL2Summary } from "./l2.js";
function deriveL1(input) {
  const adrs = input.adrs ?? [];
  const stages = input.stages ?? [];
  const todos = input.todos ?? [];
  const adr = adrs.find((item) => item.status === "accepted") ?? adrs[0];
  const doing = todos.find((todo) => todo.status === "doing");
  const stage = doing ? stages.find((item) => item.id === doing.stageId) : stages.find((item) => item.status === "doing");
  const query = input.liveQuery?.trim();
  return {
    goal: adr?.title.trim(),
    phase: stage?.title.trim(),
    currentStep: doing?.content.trim() || (adr && query ? query : void 0),
    hardConstraints: input.pinned?.hardConstraints,
    l2Summary: renderL2Summary({
      ...input.pinned,
      recentErrors: input.recentErrors ?? input.pinned?.recentErrors
    }, { stages, todos }),
    openArcs: input.openArcs,
    harvest: input.harvest,
    lessons: input.recall,
    adrRequired: input.adrRequired
  };
}
function assembleLayers(input) {
  return {
    l0: renderL0(),
    l1: renderL1(deriveL1(input))
  };
}
export {
  assembleLayers,
  deriveL1
};
