// The v1 frozen-section format. Keep whitespace and coercion byte-equivalent to OUT-09 snapshots.
// These pure functions are also the proof boundary for presentation; they grant no authority.
export type ScopeAsset = {
  asset_id: string | null;
  display_number: string;
  description: string;
  identity_status: string;
  serial: string | null;
  configuration_description: string | null;
  method: string | null;
  limits: string | null;
};
export type ScopeItem = {
  sequence: number;
  task_kind: string;
  task_description: string;
  completion_requirements: string[];
  shutdown_condition: string | null;
  assets: ScopeAsset[];
};
export type SectionScope = {
  revision: number;
  summary: string;
  exclusions: string;
  diagnostic_limit: string | null;
  items: ScopeItem[];
};
export type SectionHistory = {
  kind: string;
  confidence: string;
  summary: string;
};
export type SectionControl = {
  label: string;
  outcome: string;
  reason: string | null;
  evidence_title: string | null;
  evidence_hash: string | null;
};
export type Arrangements = {
  location: string;
  contact: null | { name: string; phone: string | null; email: string | null };
  access: string | null;
  commitment: string;
};
const text = (value: unknown) => String(value ?? "Not recorded");
export const noHistory =
  "No service-audience history selected. The preparation notes must explain the review or relevant absence.";
export const stopInstructions =
  "Stop if site access, isolation, shutdown authority or competency cannot be confirmed. Tool-preparation exceptions do not waive these controls.";
export function formatArrangements(v: Arrangements) {
  return `Location: ${v.location}\nContact: ${v.contact ? `${v.contact.name}; ${text(v.contact.phone)}; ${text(v.contact.email)}` : "Not recorded"}\nAccess: ${text(v.access)}\nDate agreement: ${v.commitment}. This is not pack acknowledgement.`;
}
export function formatScope(r: SectionScope) {
  return `Approved scope r${String(r.revision).padStart(2, "0")}: ${r.summary}\nExclusions: ${r.exclusions}\nDiagnostic limits: ${text(r.diagnostic_limit)}\n\n${r.items.map((i) => `${i.sequence}. ${i.task_kind}: ${i.task_description}\nCompletion: ${i.completion_requirements}\nShutdown condition: ${text(i.shutdown_condition)}`).join("\n\n")}`;
}
export function formatEquipment(items: ScopeItem[]) {
  return items
    .flatMap((i) => i.assets)
    .map(
      (x) =>
        `${x.display_number}: ${x.description}\nIdentity: ${x.identity_status}; serial: ${text(x.serial)}\nConfiguration: ${text(x.configuration_description)}${x.method ? `\nIdentification only: ${x.method}; limits: ${x.limits}` : ""}`,
    )
    .join("\n\n");
}
export function formatHistory(history: SectionHistory[]) {
  return history.length
    ? history
        .map((h) => `${h.kind} (${h.confidence}): ${h.summary}`)
        .join("\n\n")
    : noHistory;
}
export function formatControls(controls: SectionControl[]) {
  return controls
    .map(
      (x) =>
        `${x.label}: ${x.outcome}. ${x.reason ?? ""}\nEvidence: ${x.evidence_title ?? "Not recorded"}; ${x.evidence_hash ?? ""}`,
    )
    .join("\n\n");
}
export function formatSiteControls(
  access: string | null,
  biosecurity: string | null,
  controls: string,
) {
  return `Access: ${text(access)}\nBiosecurity: ${text(biosecurity)}\n${controls}\n${stopInstructions}`;
}
export function completionPrefix(items: ScopeItem[]) {
  return `${items.map((i) => `${i.sequence}. ${i.completion_requirements}`).join("\n")}\n`;
}
