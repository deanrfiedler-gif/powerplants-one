// Equipment projections retain canonical Asset and CS identities.
export type EquipmentRow = {
  id: string;
  version: number;
  company_id: string;
  display_number: string;
  description: string;
  manufacturer: string | null;
  model: string | null;
  serial: string | null;
  identity_status: string;
  lifecycle_status: string;
  site_id: string;
  site_name: string;
  address: Record<string, string> | null;
  facility_id: string | null;
  installed_name: string | null;
  customers: { id: string; name: string; role: string }[];
  served: { id: string; name: string; source_id: string }[];
  moved: boolean;
};
export const lifecycleStates = ["Active", "Removed", "Decommissioned"] as const;
export const changeKinds = [
  "Configuration",
  "Relocate",
  "CorrectLocation",
  "Replace",
  "Retire",
] as const;
export const identityStates = ["Verified", "Unresolved", "Disputed"] as const;
export const equipmentViews = [
  "overview",
  "configuration",
  "history",
  "lifecycle",
  "inspections",
  "backups",
  "support",
] as const;
export const backupSteps = [
  "BackupReviewed",
  "ProcedureReviewed",
  "RecoveryTested",
  "RecoveryVerified",
] as const;
// Repeating an earlier stage invalidates subsequent current-stage claims, never retained history.
export function backupProgress<T extends { step: string; result: string }>(
  reviews: T[],
) {
  const current: Partial<Record<string, T>> = {};
  for (const r of reviews) {
    const index = backupSteps.indexOf(r.step as (typeof backupSteps)[number]);
    if (index < 0) continue;
    for (const later of backupSteps.slice(index)) delete current[later];
    current[r.step] = r;
  }
  return current;
}
export function lookupIdentifier(
  raw: string,
): { value: string; kind: "id" | "reference" | "serial" } | null {
  const text = raw.trim();
  if (!text || text.length > 200 || /[\u0000-\u001f\u007f]/.test(text))
    return null;
  const id =
    "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  if (new RegExp(`^${id}$`, "i").test(text))
    return { value: text.toLowerCase(), kind: "id" };
  const link = new RegExp(`^/equipment/(${id})$`, "i").exec(text);
  if (link) return { value: link[1].toLowerCase(), kind: "id" };
  if (/^SYN-PPO-AST-\d{6}$/.test(text))
    return { value: text, kind: "reference" };
  if (/^(?:SYN-PPO-|https?:|javascript:|data:|\/)/i.test(text)) return null;
  return { value: text, kind: "serial" };
}
