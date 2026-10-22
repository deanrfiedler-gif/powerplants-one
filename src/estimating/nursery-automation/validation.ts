import {
  choice,
  invalid,
  label,
  object,
  optionalText,
  uuid,
} from "../../shared/validation";
import { catalogue } from "./catalogue";
import {
  fields,
  knowledge,
  deliveryKinds,
  applicability,
  selections,
  responsibilities,
  type Fact,
  type Study,
} from "./model";
export function bounded(value: unknown) {
  let json: string | undefined;
  try {
    json = JSON.stringify(value);
  } catch {
    invalid("payload", "Use bounded JSON.");
  }
  if (!json || Buffer.byteLength(json) > 65536)
    invalid(
      "payload",
      "Nursery discovery is limited to 64 KiB. Nothing was truncated.",
    );
}
const list = (v: unknown, field: string, max: number): unknown[] => {
  if (!Array.isArray(v) || v.length > max)
    invalid(field, `Use at most ${max} entries.`);
  return v;
};
export function parseFact(value: unknown, field: string, unit = "text"): Fact {
  const r = object(value, [
    "value",
    "knowledge",
    "source",
    "alternatives",
    "owner",
    "next_action",
  ]);
  const k = choice(r.knowledge, field, knowledge);
  const checkValue = (v: unknown) => {
    const text = label(v, field, 500);
    if (
      unit !== "text" &&
      (!/^(0|[1-9][0-9]{0,5})(\.[0-9]{1,3})?$/.test(text) ||
        Number(text) > 100000)
    )
      invalid(
        field,
        "Enter a non-negative decimal up to 100,000, with at most three decimal places. Blank means unknown.",
      );
    if (["count", "pots"].includes(unit) && !/^\d+$/.test(text))
      invalid(field, "Use a whole count.");
    return text;
  };
  const valueText = r.value === null ? null : checkValue(r.value);
  const source = optionalText(r.source, field + ".source", 500);
  const alternatives = list(r.alternatives, field + ".alternatives", 5).map(
    (v) => {
      const a = object(v, ["value", "source"]);
      return {
        value: checkValue(a.value),
        source: label(a.source, field + ".source", 500),
      };
    },
  );
  if (
    ["Unknown", "NotApplicable", "Conflict"].includes(k)
      ? valueText !== null
      : valueText === null || !source
  )
    invalid(
      field,
      "Unknown, conflict and not applicable have no selected value. A recorded value needs its source.",
    );
  if (
    k === "Conflict" &&
    (alternatives.length < 2 ||
      new Set(alternatives.map((a) => a.value)).size < 2)
  )
    invalid(
      field,
      "Retain at least two different source values for a conflict.",
    );
  if (k === "NotApplicable" && !source)
    invalid(field, "Explain why this information is not applicable.");
  return {
    value: valueText,
    knowledge: k,
    source,
    alternatives,
    owner: optionalText(r.owner, field + ".owner", 120),
    next_action: optionalText(r.next_action, field + ".next_action", 500),
  };
}
export function parseStudy(value: unknown): Study {
  bounded(value);
  const r = object(value, [
    "schema_version",
    "name",
    "project_type",
    "system_id",
    "current_process",
    "site_requirements",
    "candidate_ids",
    "scenarios",
    "delivery",
  ]);
  if (r.schema_version !== 1)
    invalid("schema_version", "Use Nursery discovery schema 1.");
  const candidates = list(r.candidate_ids, "candidate_ids", 10).map((v) =>
    choice(
      v,
      "candidate_ids",
      catalogue.entries.map((e) => e.id),
    ),
  );
  if (new Set(candidates).size !== candidates.length)
    invalid("candidate_ids", "Choose each candidate once.");
  const scenarios = list(r.scenarios, "scenarios", 20).map((v) => {
    const s = object(v, ["id", "name", "phase", "facts"]);
    const f = object(
      s.facts,
      fields.map((x) => x.key),
    );
    return {
      id: uuid(s.id, "scenario.id"),
      name: label(s.name, "scenario.name", 120),
      phase: choice(s.phase, "scenario.phase", ["Current", "Future"] as const),
      facts: Object.fromEntries(
        fields.map((x) => [x.key, parseFact(f[x.key], x.key, x.unit)]),
      ) as Study["scenarios"][number]["facts"],
    };
  });
  if (new Set(scenarios.map((s) => s.id)).size !== scenarios.length)
    invalid("scenarios", "Scenario identities must be unique.");
  const delivery = list(r.delivery, "delivery", 4).map((v) => {
    const d = object(v, [
      "kind",
      "applicability",
      "selection",
      "responsibility",
      "basis",
      "owner",
      "next_action",
    ]);
    return {
      kind: choice(d.kind, "delivery.kind", deliveryKinds),
      applicability: choice(
        d.applicability,
        "delivery.applicability",
        applicability,
      ),
      selection: choice(d.selection, "delivery.selection", selections),
      responsibility: choice(
        d.responsibility,
        "delivery.responsibility",
        responsibilities,
      ),
      basis: optionalText(d.basis, "delivery.basis", 500),
      owner: optionalText(d.owner, "delivery.owner", 120),
      next_action: optionalText(d.next_action, "delivery.next_action", 500),
    };
  });
  if (new Set(delivery.map((d) => d.kind)).size !== 4)
    invalid(
      "delivery",
      "Retain all four independent delivery-scope decisions.",
    );
  return {
    schema_version: 1,
    name: label(r.name, "name", 200),
    project_type: choice(r.project_type, "project_type", [
      "Replacement",
      "ConnectedLine",
      "StagedRetrofit",
      "Unknown",
    ] as const),
    system_id: r.system_id === null ? null : uuid(r.system_id, "system_id"),
    current_process: optionalText(r.current_process, "current_process", 1000),
    site_requirements: parseFact(r.site_requirements, "site_requirements"),
    candidate_ids: candidates,
    scenarios,
    delivery,
  };
}
