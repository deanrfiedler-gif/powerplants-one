export const ACTIVE_PIPELINE_ID = "c1000000-0000-4000-8000-000000000002";
export const ACTIVE_PIPELINE_LABEL = "Fictional sales pipeline";
// The original I1 stages remain valid history. New qualified deals use the
// separately seeded five-stage definition; no history is relabelled here.
export const opportunityStages = [
  "Enquiry",
  "Qualified",
  "Discovery",
  "Scoping",
  "Quoting",
  "Negotiation",
  "Closing",
] as const;
export type OpportunityStage = (typeof opportunityStages)[number];
export type StageDefinition = { stage_id: OpportunityStage; ordinal: number };
export const carriesQualification = (stage: OpportunityStage) =>
  stage !== "Enquiry";
export function permittedStageMove(
  stages: StageDefinition[],
  from: string,
  to: string,
) {
  const source = stages.find((stage) => stage.stage_id === from);
  const target = stages.find((stage) => stage.stage_id === to);
  return (
    !!source &&
    !!target &&
    (target.ordinal === source.ordinal + 1 || target.ordinal < source.ordinal)
  );
}
