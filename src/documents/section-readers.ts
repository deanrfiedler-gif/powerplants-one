import type { PackSnapshot } from "./render";
import type { SectionKey } from "./validation";
import {
  formatArrangements,
  formatScope,
  formatEquipment,
  formatHistory,
  formatControls,
  formatSiteControls,
  completionPrefix,
  stopInstructions,
  type Arrangements,
  type SectionScope,
  type SectionHistory,
  type SectionControl,
} from "./section-text";

export type SectionView = {
  revision_id: string;
  scope: (SectionScope & { verified: boolean }) | null;
  history:
    | (SectionHistory & {
        id: string;
        occurred_at: string;
        matches_snapshot: boolean;
      })[]
    | null;
};
export type StructuredSection =
  | { kind: "arrangements"; value: Arrangements }
  | { kind: "scope"; value: SectionScope }
  | { kind: "equipment"; value: SectionScope["items"] }
  | { kind: "history"; value: NonNullable<SectionView["history"]> }
  | { kind: "controls"; value: SectionControl[] }
  | {
      kind: "site-controls";
      value: {
        access: string;
        biosecurity: string;
        controls: SectionControl[];
      };
    }
  | {
      kind: "completion";
      value: { items: SectionScope["items"]; standing: string };
    };

// A repeated delimiter is ambiguous. Fall back rather than assigning customer prose to a field.
function once(text: string, marker: string): [string, string] | null {
  const parts = text.split(marker);
  return parts.length === 2 ? [parts[0], parts[1]] : null;
}
export function readArrangements(text: string): Arrangements | null {
  if (!text.startsWith("Location: ")) return null;
  const location = once(text.slice(10), "\nContact: ");
  const contact = location && once(location[1], "\nAccess: ");
  const access = contact && once(contact[1], "\nDate agreement: ");
  const suffix = ". This is not pack acknowledgement.";
  if (!location || !contact || !access || !access[1].endsWith(suffix))
    return null;
  const fields = contact[0].split("; ");
  if (contact[0] !== "Not recorded" && fields.length !== 3) return null;
  const value: Arrangements = {
    location: location[0],
    contact:
      contact[0] === "Not recorded"
        ? null
        : { name: fields[0], phone: fields[1], email: fields[2] },
    access: access[0],
    commitment: access[1].slice(0, -suffix.length),
  };
  return formatArrangements(value) === text ? value : null;
}
export function readControls(text: string): SectionControl[] | null {
  if (text === "") return [];
  const controls: SectionControl[] = [];
  for (const block of text.split("\n\n")) {
    const evidence = once(block, "\nEvidence: ");
    if (!evidence) return null;
    const row =
      /^(.*): (Unknown|Pass|Blocked|PermittedException|NotApplicable)\. ([\s\S]*)$/.exec(
        evidence[0],
      );
    const source = once(evidence[1], "; ");
    if (!row || !source || !row[1]) return null;
    controls.push({
      label: row[1],
      outcome: row[2],
      reason: row[3],
      evidence_title: source[0],
      evidence_hash: source[1],
    });
  }
  return formatControls(controls) === text ? controls : null;
}
export function readSection(
  section: SectionKey,
  snapshot: PackSnapshot,
  revisionId: string,
  view: SectionView | null | undefined,
): StructuredSection | null {
  if (
    snapshot.schema_version !== 1 ||
    ![1, 2].includes(snapshot.template.version)
  )
    return null;
  const text = snapshot.sections[section].text;
  const scoped = view?.revision_id === revisionId ? view : null;
  const scope = scoped?.scope?.verified ? scoped.scope : null;
  if (section === "customer_arrangements") {
    const value = readArrangements(text);
    return value ? { kind: "arrangements", value } : null;
  }
  if (section === "scope" && scope && formatScope(scope) === text)
    return { kind: "scope", value: scope };
  if (section === "equipment" && scope && formatEquipment(scope.items) === text)
    return { kind: "equipment", value: scope.items };
  if (
    section === "history" &&
    scoped?.history &&
    scoped.history.length === snapshot.history.length &&
    scoped.history.every(
      (h, i) => h.matches_snapshot && h.id === snapshot.history[i].id,
    ) &&
    formatHistory(scoped.history) === text
  )
    return { kind: "history", value: scoped.history };
  if (section === "readiness") {
    const value = readControls(text);
    return value ? { kind: "controls", value } : null;
  }
  if (
    section === "site_controls" &&
    text.startsWith("Access: ") &&
    text.endsWith(`\n${stopInstructions}`)
  ) {
    const access = once(
      text.slice(8, -stopInstructions.length - 1),
      "\nBiosecurity: ",
    );
    if (!access) return null;
    // The controls must be exactly the same frozen block as section 07. This avoids interpreting
    // a customer-written line that happens to resemble a control as an authoritative outcome.
    const controlText = snapshot.sections.readiness.text;
    if (!access[1].endsWith(`\n${controlText}`)) return null;
    const biosecurity = access[1].slice(0, -controlText.length - 1);
    const controls = readControls(controlText);
    if (
      !controls ||
      formatSiteControls(access[0], biosecurity, formatControls(controls)) !==
        text
    )
      return null;
    return {
      kind: "site-controls",
      value: { access: access[0], biosecurity, controls },
    };
  }
  if (section === "completion" && scope) {
    const prefix = completionPrefix(scope.items);
    if (!text.startsWith(prefix)) return null;
    const standing = text.slice(prefix.length);
    return prefix + standing === text
      ? { kind: "completion", value: { items: scope.items, standing } }
      : null;
  }
  return null;
}
