import type { DiscoveryInput } from "../estimating/discovery";
import { discoveryDefinition } from "../estimating/discovery-definition";
import type { DiscoveryFinding } from "../estimating/configuration-definition";

export type WorkingChange = {
  label: string;
  change: "Added" | "Changed" | "Removed";
  step: DiscoveryFinding["step"];
  entity_id: string | null;
  field: string;
};
export function changesSince(
  before: DiscoveryInput | null,
  after: DiscoveryInput,
): WorkingChange[] {
  const out: WorkingChange[] = [],
    same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const compare = <T extends { id: string }>(
    label: string,
    step: WorkingChange["step"],
    name: (x: T) => string,
    a: T[] = [],
    b: T[] = [],
    target: (x: T) => { entity_id: string; field: string } = (x) => ({
      entity_id: x.id,
      field: "name",
    }),
  ) => {
    for (const x of b) {
      const previous = a.find((y) => y.id === x.id);
      if (!previous || !same(x, previous)) {
        const fields = previous
          ? Object.keys(x)
              .filter(
                (k) =>
                  !same(
                    (x as Record<string, unknown>)[k],
                    (previous as Record<string, unknown>)[k],
                  ),
              )
              .filter((k) => k !== "lineage")
          : [];
        out.push({
          label: `${name(x) || label}${fields.length ? ` · ${fields.join(", ").replace(/_/g, " ")}` : ""}`,
          change: previous ? "Changed" : "Added",
          step,
          ...target(x),
        });
      }
    }
    for (const x of a)
      if (!b.some((y) => y.id === x.id))
        out.push({
          label: `${label} · ${name(x)}`,
          change: "Removed",
          step,
          entity_id: null,
          field: "",
        });
  };
  const bc = before?.configuration,
    ac = after.configuration;
  compare(
    "Area",
    "Requirements",
    (a) => a.label || "New area",
    bc?.areas,
    ac?.areas,
    (a) => ({ entity_id: a.id, field: "label" }),
  );
  compare(
    "System",
    "Configuration",
    (s) => s.name || "New system",
    bc?.systems,
    ac?.systems,
  );
  compare(
    "Fact",
    "Configuration",
    (f) =>
      `${ac?.systems.find((s) => s.id === f.system_id)?.name ?? "System"} · ${f.field}`,
    bc?.facts,
    ac?.facts,
    (f) => ({ entity_id: f.system_id, field: f.field }),
  );
  compare(
    "Evidence",
    "Configuration",
    (e) => e.observation || "New observation",
    bc?.evidence,
    ac?.evidence,
  );
  compare(
    "Work item",
    "Scope & delivery",
    (r) => r.work || "New work item",
    bc?.responsibilities,
    ac?.responsibilities,
    (r) => ({ entity_id: r.id, field: "work" }),
  );
  compare(
    "Follow-up",
    "Review",
    (f) => f.reason || "New follow-up",
    bc?.follow_ups,
    ac?.follow_ups,
  );
  if (bc?.definition_id !== ac?.definition_id)
    out.push({
      label: "Configuration catalogue",
      change: bc ? "Changed" : "Added",
      step: "Configuration",
      entity_id: null,
      field: "",
    });
  for (const x of after.answers) {
    const previous = before?.answers.find(
      (a) => a.question_id === x.question_id,
    );
    if (
      (!previous && x.state !== "Empty") ||
      (previous && !same(x, previous))
    ) {
      const step = ["Q01", "Q02", "Q03"].includes(x.question_id)
        ? "Requirements"
        : ["Q05", "Q06"].includes(x.question_id)
          ? "Configuration"
          : "Scope & delivery";
      out.push({
        label:
          discoveryDefinition.questions.find((q) => q.id === x.question_id)
            ?.label ?? x.question_id,
        change: previous ? "Changed" : "Added",
        step,
        entity_id: null,
        field: x.question_id,
      });
    }
  }
  for (const [key, label, field] of [
    ["scope", "Scope membership", "Site"],
    ["effort", "Estimating effort", "Effort"],
  ] as const) {
    if (before && !same(before[key], after[key]))
      out.push({
        label,
        change: "Changed",
        step: "Requirements",
        entity_id: null,
        field,
      });
  }
  return out;
}
