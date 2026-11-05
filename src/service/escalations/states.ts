export const caseStates = [
  "Diagnosing",
  "WaitingOnManufacturer",
  "ReplyToActOn",
  "Closed",
  "Withdrawn",
] as const;
export type CaseState = (typeof caseStates)[number];
export const stateLabels: Record<CaseState, string> = {
  Diagnosing: "Diagnosing",
  WaitingOnManufacturer: "Waiting on manufacturer",
  ReplyToActOn: "Reply to act on",
  Closed: "Closed",
  Withdrawn: "Withdrawn",
};
export const caseActions = [
  "diagnose",
  "photo",
  "capture_configuration",
  "prepare_pack",
  "review_pack",
  "record_sent",
  "record_reply",
  "next_action",
  "follow_up",
  "close",
  "withdraw",
] as const;
export type CaseAction = (typeof caseActions)[number];

export function allowedAction(state: CaseState, action: CaseAction) {
  if (state === "Closed" || state === "Withdrawn") return false;
  if (action === "withdraw") return true;
  if (
    [
      "diagnose",
      "photo",
      "capture_configuration",
      "prepare_pack",
      "review_pack",
      "record_sent",
    ].includes(action)
  )
    return state === "Diagnosing";
  if (action === "record_reply") return state === "WaitingOnManufacturer";
  return state === "ReplyToActOn";
}
