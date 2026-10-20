import type { Answer, DiscoveryInput } from "../estimating/discovery";
import type { discoveryCreationOptions } from "../estimating/discovery-creation-context";
import { applicableQuestions } from "../estimating/discovery-questions";
import { equipmentCatalogueDefinition } from "../estimating/equipment-catalogue";
import { blankDiscovery, type FormOptions } from "./discovery-fields";

export const creationSteps = ["Requirements", "Configuration", "Scope & delivery", "Pricing", "Review"] as const;
export type CreationStep = typeof creationSteps[number];
export type CreationContext = Awaited<ReturnType<typeof discoveryCreationOptions>>;
export type CreationIssue = { field: string; message: string; step: CreationStep; question?: string };
export const questionStep = (id: string): CreationStep => ["Q01", "Q02", "Q03"].includes(id)
  ? "Requirements" : ["Q05", "Q06"].includes(id) ? "Configuration" : "Scope & delivery";

export function initialCreationDraft(options: FormOptions, brief: CreationContext["brief"]): DiscoveryInput {
  const draft = blankDiscovery(options, options.opportunity.site_id);
  // A new scope starts with the adopted catalogue; existing r01 revisions remain unchanged.
  draft.configuration = { ...draft.configuration!, schema_version: 2, definition_id: equipmentCatalogueDefinition };
  if (!brief?.selection || brief.source_changed) return draft;
  const fields = { Q01: brief.content.included_scope, Q02: brief.content.exclusions, Q03: brief.content.assumptions };
  draft.answers = draft.answers.map(answer => {
    const value = fields[answer.question_id as keyof typeof fields];
    return value ? { ...answer, state: "Answered", value, source: `Accepted Sales brief r${brief.revision}` } : answer;
  });
  // Never infer work tags, equipment configuration, confirmations or follow-up reasons.
  return draft;
}

// Early, field-linked guidance. Server preview and creation still validate the complete
// proposal and current authority; this does not calculate business readiness.
export function creationIssues(draft: DiscoveryInput, options: FormOptions, ownerId: string): CreationIssue[] {
  const issues: CreationIssue[] = [];
  const add = (field: string, message: string, step: CreationStep = "Requirements", question?: string) =>
    issues.push({ field, message, step, question });
  const followUp = (value: Answer["follow_up"], prefix: string, step: CreationStep, question?: string) => {
    if (!value?.owner_id) add(`${prefix}-owner`, "Choose an owner for this follow-up.", step, question);
    if (!value?.reason.trim()) add(`${prefix}-reason`, "Record what needs to be confirmed.", step, question);
  };
  if (!ownerId) add("creation.owner_id", "Choose an eligible estimating owner.");
  if (!draft.scope.systems.length) add("scope.systems", "Choose at least one work tag.");
  if (draft.scope.mode === "Site" && !draft.scope.site_id) add("scope.site_id", "Choose the Site for this discovery.");
  if (draft.scope.mode !== "Site" && !draft.scope.site_reason?.trim()) add("scope.site_reason", "Record the Site declaration reason.");
  if (draft.scope.mode === "Unknown") followUp(draft.scope.follow_up, "Site", "Requirements");
  if (draft.effort.value === "Unknown") followUp(draft.effort.follow_up, "Effort", "Requirements");
  else if (!draft.effort.source?.trim()) add("effort.source", "Record the source of the effort declaration.");
  if (draft.scope.unsupported_scope) followUp(draft.scope.unsupported_scope, "Additional scope", "Scope & delivery");
  for (const q of applicableQuestions(draft.scope, draft.answers, options.definition)) {
    const a = draft.answers.find(a => a.question_id === q.id), step = questionStep(q.id);
    if (!a) { add(q.id, "Record an answer or an owned follow-up.", step, q.id); continue; }
    const unresolved = a.state === "Empty" || a.state === "Deferred" || a.state === "Assumed" || a.value === "Unknown" || (q.required && a.state !== "Confirmed");
    if (unresolved || a.follow_up) followUp(a.follow_up, q.id, step, q.id);
    if (["Answered", "Confirmed", "Assumed"].includes(a.state)) {
      if (a.value === null || a.value === "") add(q.id, "Enter the answer being recorded.", step, q.id);
      if (!a.source?.trim()) add(`${q.id}.source`, "Record where this answer comes from.", step, q.id);
    }
    if (typeof a.value === "string" && q.max_length && a.value.length > q.max_length)
      add(q.id, `Review this answer and keep it within ${q.max_length} characters. The full Sales statement remains in the handover.`, step, q.id);
  }
  return issues;
}

export const creationBriefLabel = (brief: { state: string; revision: number | null } | null) => !brief
  ? "no Sales brief" : brief.state === "Unavailable" ? "Sales context unavailable"
  : brief.state === "Accepted" ? `accepted Sales brief r${brief.revision}`
  : `Sales brief ${brief.state.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()}`;
