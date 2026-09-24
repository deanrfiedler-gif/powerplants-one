export const controlKinds = [
  "basis",
  "document",
  "query",
  "submittal",
  "review",
  "issue",
  "deliverable",
] as const;
export type ControlKind = (typeof controlKinds)[number];
export const purposes = [
  "InformationOnly",
  "DesignPreparation",
  "TechnicalReleaseForProcurement",
] as const;
export type Purpose = (typeof purposes)[number];
export const basisViews = [
  ["basis", "Basis & scope"],
  ["requirements", "Requirements"],
  ["assumptions", "Assumptions & questions"],
  ["interfaces", "Interfaces"],
  ["sources", "Calculations & sources"],
  ["review", "Review & handover"],
] as const;
export type Requirement = {
  id: string;
  title: string;
  owner_id: string;
  criterion: string;
  source_ids: string[];
  deliverable_ids: string[];
};
export type BasisInput = {
  id: string;
  kind: "Assumption" | "Constraint" | "Question";
  title: string;
  owner_id: string;
  due_date: string | null;
  blocking: boolean;
  state: "Unknown" | "Unconfirmed" | "Supported";
  response: string | null;
  source_ids: string[];
  deliverable_ids: string[];
};
export type Interface = {
  id: string;
  title: string;
  provider_id: string;
  receiver_id: string;
  required_input: string;
  expected_output: string;
  criterion: string;
  source_ids: string[];
};
export type Calculation = {
  id: string;
  title: string;
  model_reference: string;
  model_version: string;
  source_ids: string[];
  check_evidence: string | null;
};
export type BasisContent = {
  schema_version: 1;
  purpose: Purpose;
  summary: string;
  exclusions: string;
  facility_ids: string[];
  source_ids: string[];
  requirements: Requirement[];
  inputs: BasisInput[];
  interfaces: Interface[];
  calculations: Calculation[];
};
export type DocumentContent = {
  schema_version: 1;
  discipline: string;
  document_type: string;
  source_ids: string[];
};
export type QueryContent = {
  schema_version: 1;
  question: string;
  source_ids: string[];
  deliverable_ids: string[];
  change_id: string | null;
  review_required: boolean;
  response: string | null;
  response_by: string | null;
  response_at: string | null;
  actions: string | null;
};
export type SubmittalContent = {
  schema_version: 1;
  supplier: string;
  product_reference: string;
  purchase_reference: string | null;
  submitted_revision: string;
  evidence: string;
  source_ids: string[];
  reviewer_id: string;
  downstream_actions: string;
};
export type ReviewContent = {
  schema_version: 1;
  purpose: Purpose;
  source_ids: string[];
  basis_id: string | null;
  document_revision_ids: string[];
  submittal_ids: string[];
  submission: unknown;
  submission_hash: string;
  policy_id: string;
  contributors: string[];
};
export type IssueContent = {
  schema_version: 1;
  purpose: Purpose;
  source_ids: string[];
  review_id: string;
  manifest: unknown;
  manifest_hash: string;
  policy_id: string;
};
export type DeliverableContent = {
  schema_version: 1;
  discipline: string;
  document_id: string | null;
  source_ids: string[];
  prerequisite: string;
  prerequisite_evidence: string | null;
  next_action: string;
  planned_hours: string | null;
  effort_source: string | null;
  authorised_hours: string | null;
  authorisation_reference: string | null;
};
export type ContentByKind = {
  basis: BasisContent;
  document: DocumentContent;
  query: QueryContent;
  submittal: SubmittalContent;
  review: ReviewContent;
  issue: IssueContent;
  deliverable: DeliverableContent;
};
export type ControlRecord<K extends ControlKind = ControlKind> = {
  id: string;
  workspace_id: string;
  package_id: string;
  company_id: string;
  reference: string;
  title: string;
  owner_id: string;
  due_date: string | null;
  version: number;
  revision: number;
  state: string;
  content: ContentByKind[K];
  predecessor_id: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};
export type Source = {
  id: string;
  reference: string;
  title: string;
  revision: string;
  file_version: string;
  content_hash: string | null;
  content: string | null;
  restricted: boolean;
  completeness: string;
  use: string;
  kind: string;
  permitted_purpose: string;
  predecessor_id: string | null;
};
export function sourceIds(content: ContentByKind[ControlKind]): string[] {
  const basis = content as Partial<BasisContent>;
  return [
    ...new Set([
      ...content.source_ids,
      ...[
        ...(basis.requirements ?? []),
        ...(basis.inputs ?? []),
        ...(basis.interfaces ?? []),
        ...(basis.calculations ?? []),
      ].flatMap((r) => r.source_ids),
    ]),
  ].sort();
}
export function basisBlockers(
  content: BasisContent,
  confirmed: ReadonlySet<string> = new Set(),
): string[] {
  const result: string[] = [];
  if (!content.requirements.length)
    result.push("Record at least one requirement.");
  if (!sourceIds(content).length) result.push("Select exact source evidence.");
  for (const r of content.requirements)
    if (!r.source_ids.length)
      result.push(`${r.title}: source evidence is missing.`);
  for (const i of content.inputs)
    if (
      i.blocking &&
      (i.state !== "Supported" || !i.response || !i.source_ids.length)
    )
      result.push(`${i.title}: blocking input is ${i.state.toLowerCase()}.`);
  for (const i of content.interfaces) {
    if (i.provider_id === i.receiver_id)
      result.push(`${i.title}: two distinct responsible parties are required.`);
    if (
      !i.source_ids.length ||
      !confirmed.has(`${i.id}:${i.provider_id}`) ||
      !confirmed.has(`${i.id}:${i.receiver_id}`)
    )
      result.push(
        `${i.title}: both parties must confirm the exact interface and inputs.`,
      );
  }
  for (const c of content.calculations)
    if (!c.check_evidence || !c.source_ids.length)
      result.push(`${c.title}: calculation/model check evidence is missing.`);
  return result;
}
export function sourceBlockers(
  ids: readonly string[],
  sources: readonly Source[],
) {
  return ids.flatMap((id) => {
    const source = sources.find((s) => s.id === id);
    return !source
      ? ["A selected source is unavailable or restricted."]
      : source.use !== "Current" || source.completeness !== "Complete"
        ? [
            `${source.reference}: source is ${source.use === "Current" ? source.completeness : source.use}.`,
          ]
        : [];
  });
}
export function deliverableState(
  record: ControlRecord<"deliverable">,
  released: boolean,
) {
  if (released) return "Released";
  if (!record.content.prerequisite_evidence)
    return "Blocked — prerequisite evidence needed";
  return record.state;
}
