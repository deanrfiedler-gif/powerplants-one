import { canonical } from "../../platform/operations";
import {
  object,
  invalid,
  label,
  choice,
  uuid,
  version,
  common,
  dateOnly,
} from "../../shared/validation";
import { bundleHash, bundleId, definition } from "./definition";
import type {
  DraftProposal,
  Decision,
  NativePriceProposal,
  AdoptionRequest,
} from "./types";
export const MAX_BYTES = 262144;
export function bounded(value: unknown) {
  let nodes = 0;
  const visit = (v: unknown, depth: number) => {
    if (depth > 10 || ++nodes > 15000)
      invalid(
        "payload",
        "Payload nesting or item count exceeds the specialist contract.",
      );
    if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v)) {
        if (["__proto__", "constructor", "prototype"].includes(k))
          invalid(k, "Unsupported key.");
        visit(x, depth + 1);
      }
  };
  visit(value, 0);
  if (Buffer.byteLength(canonical(value), "utf8") > MAX_BYTES)
    invalid("payload", "The complete specialist envelope exceeds 256 KiB.");
}
export function raw(value: unknown, field: string, max = 300): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    invalid(field, `Use at most ${max} characters on one line.`);
  return value;
}
export function sha(value: unknown, field = "hash"): string {
  if (typeof value !== "string" || !/^([a-f0-9]{64})$/.test(value))
    invalid(field, "An exact SHA-256 is required.");
  return value;
}
const bool = (v: unknown, f: string) => {
  if (typeof v !== "boolean") invalid(f, "An explicit choice is required.");
  return v;
};
export function list(value: unknown, field: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max)
    invalid(field, `Use at most ${max} items.`);
  return value;
}
function map<T>(
  v: unknown,
  keys: string[],
  f: string,
  parse: (v: unknown, k: string) => T,
): Record<string, T> {
  const p = object(v, keys);
  if (Object.keys(p).length !== keys.length)
    invalid(f, "Retain every defined field exactly once.");
  return Object.fromEntries(keys.map((k) => [k, parse(p[k], k)]));
}
const position = (v: unknown) => {
  const s = raw(v, "key");
  if (!definition.lines.some((l) => l.key === s))
    invalid("key", "Unknown source position.");
  return s;
};
function unique<T extends { key: string }>(a: T[], field: string) {
  if (new Set(a.map((x) => x.key)).size !== a.length)
    invalid(field, "Duplicate stable keys are not accepted.");
  return a;
}
export function proposal(value: unknown): DraftProposal {
  bounded(value);
  const p = object(value, [
    "schema_version",
    "definition_bundle_id",
    "definition_bundle_hash",
    "inputs",
    "extra_screens",
    "parameters",
    "manual_quantities",
    "gates",
    "exclusions",
    "illustrative_prices",
  ]);
  if (
    p.schema_version !== 1 ||
    p.definition_bundle_id !== bundleId ||
    p.definition_bundle_hash !== bundleHash
  )
    invalid(
      "definition_bundle_id",
      "Use the exact supported native definition bundle.",
    );
  const inputs = map(
    p.inputs,
    definition.fields.map((f) => f.key),
    "inputs",
    (v, k) => {
      const r = object(v, ["raw", "attribution"]),
        a = object(r.attribution, ["kind", "note", "source_field"]),
        value = raw(r.raw, k),
        field = definition.fields.find((f) => f.key === k)!;
      if (field.options && value !== "" && !field.options.includes(value))
        invalid(k, "Choose a listed value or leave this draft choice blank.");
      return {
        raw: value,
        attribution: {
          kind: choice(a.kind, k, [
            "entered",
            "inherited",
            "recovered-default",
            "assumption",
          ] as const),
          note: raw(a.note, k, 1000),
          source_field:
            a.source_field === null
              ? null
              : uuid(a.source_field, "source_field"),
        },
      };
    },
  );
  const parameters = map(
    p.parameters,
    definition.catalogue.parameters.map((x) => x.id),
    "parameters",
    (v, k) => {
      const r = object(v, ["raw", "reason"]);
      return { raw: raw(r.raw, k), reason: label(r.reason, k, 1000) };
    },
  );
  const extra_screens = list(p.extra_screens, "extra_screens", 5).map(
    (v, i) => {
      const r = object(v, [
        "id",
        "count",
        "length",
        "overhang",
        "width",
        "material",
        "reason",
      ]);
      if (r.id !== `EXTRA-${i + 1}`)
        invalid("extra_screens", "Retain the five ordered slot identities.");
      return {
        id: String(r.id),
        count: raw(r.count, "count"),
        length: raw(r.length, "length"),
        overhang: raw(r.overhang, "overhang"),
        width: raw(r.width, "width"),
        material: raw(r.material, "material"),
        reason: label(r.reason, "reason", 1000),
      };
    },
  );
  if (extra_screens.length !== 5)
    invalid("extra_screens", "Retain all five slots.");
  const manual_quantities = map(
    p.manual_quantities,
    definition.manual_rows.map((r) => `CE-LINE-${r}`),
    "manual_quantities",
    (v, k) => {
      const r = object(v, ["value", "reason", "basis_hash"]);
      return {
        value: r.value === null ? null : raw(r.value, k),
        reason: label(r.reason, k, 1000),
        basis_hash: r.basis_hash === null ? null : sha(r.basis_hash),
      };
    },
  );
  const gates = map(
    p.gates,
    definition.gates.map((r) => `B${r}`),
    "gates",
    (v, k) => {
      const r = object(v, ["include", "reason"]);
      return { include: bool(r.include, k), reason: label(r.reason, k, 1000) };
    },
  );
  const exclusions = unique(
    list(p.exclusions, "exclusions", 143).map((v) => {
      const r = object(v, ["key", "excluded", "reason"]);
      return {
        key: position(r.key),
        excluded: bool(r.excluded, "excluded"),
        reason: label(r.reason, "reason", 1000),
      };
    }),
    "exclusions",
  );
  const illustrative_prices = unique(
    list(p.illustrative_prices, "illustrative_prices", 143).map((v) => {
      const r = object(v, ["key", "price"]),
        q = object(r.price, [
          "cost",
          "sell",
          "currency",
          "no_purchase",
          "reason",
          "effective_date",
        ]);
      return {
        key: position(r.key),
        price: {
          cost: raw(q.cost, "cost"),
          sell: raw(q.sell, "sell"),
          currency: choice(q.currency, "currency", ["AUD", "EUR"] as const),
          no_purchase: bool(q.no_purchase, "no_purchase"),
          reason: label(q.reason, "reason", 1000),
          effective_date:
            q.effective_date === null
              ? null
              : dateOnly(q.effective_date, "effective_date"),
        },
      };
    }),
    "illustrative_prices",
  );
  return {
    schema_version: 1,
    definition_bundle_id: bundleId,
    definition_bundle_hash: bundleHash,
    inputs,
    parameters,
    extra_screens,
    manual_quantities,
    gates,
    exclusions,
    illustrative_prices,
  };
}
export function decisions(value: unknown): Decision[] {
  return unique(
    list(value, "decisions", 143).map((v) => {
      const r = object(v, ["key", "choice", "reason"]);
      return {
        key: position(r.key),
        choice: choice(r.choice, "choice", [
          "keep",
          "generated",
          "remove",
          "restore",
          "omit",
          "retain",
        ] as const),
        reason: label(r.reason, "reason", 1000),
      };
    }),
    "decisions",
  );
}
export function draftRequest(value: unknown, mutation = true) {
  bounded(value);
  const p = object(value, [
    ...(mutation ? ["operation_id", "schema_version", "reason"] : []),
    "expected_version",
    "proposal",
    "decisions",
    "proposal_signature",
  ]);
  return {
    ...(mutation ? common(p) : {}),
    expected_version: version(p.expected_version),
    proposal: proposal(p.proposal),
    decisions: decisions(p.decisions ?? []),
    proposal_signature:
      p.proposal_signature === undefined ? null : sha(p.proposal_signature),
  };
}
export function adoptionRequest(
  value: unknown,
  mutation = false,
): AdoptionRequest & {
  proposal_signature: string | null;
  operation_id: string;
  reason: string;
  schema_version: 1;
} {
  bounded(value);
  const r = object(value, [
    ...(mutation ? ["operation_id", "schema_version", "reason"] : []),
    "run_id",
    "resolved_set_id",
    "resolved_set_hash",
    "estimate_id",
    "estimate_version_id",
    "expected_configuration_version",
    "expected_workspace_version",
    "expected_estimate_version",
    "discovery_revision_id",
    "source_context_hash",
    "receiving_policy_id",
    "receiving_policy_hash",
    "decisions",
    "price_and_unit_proposals",
    "proposal_signature",
  ]);
  const prices: NativePriceProposal[] = unique(
    list(r.price_and_unit_proposals, "price_and_unit_proposals", 100).map(
      (v) => {
        const p = object(v, [
          "key",
          "unit_cost",
          "unit_sell",
          "effective_date",
          "reason",
        ]);
        return {
          key: position(p.key),
          unit_cost: raw(p.unit_cost, "unit_cost"),
          unit_sell: raw(p.unit_sell, "unit_sell"),
          effective_date: dateOnly(p.effective_date, "effective_date"),
          reason: label(p.reason, "reason", 400),
        };
      },
    ),
    "price_and_unit_proposals",
  );
  return {
    ...(mutation
      ? common(r)
      : { operation_id: "", reason: "", schema_version: 1 as const }),
    run_id: uuid(r.run_id, "run_id"),
    resolved_set_id: uuid(r.resolved_set_id, "resolved_set_id"),
    resolved_set_hash: sha(r.resolved_set_hash),
    estimate_id: uuid(r.estimate_id, "estimate_id"),
    estimate_version_id: uuid(r.estimate_version_id, "estimate_version_id"),
    expected_configuration_version: version(r.expected_configuration_version),
    expected_workspace_version: version(r.expected_workspace_version),
    expected_estimate_version: version(r.expected_estimate_version),
    discovery_revision_id: uuid(
      r.discovery_revision_id,
      "discovery_revision_id",
    ),
    source_context_hash: sha(r.source_context_hash),
    receiving_policy_id: label(
      r.receiving_policy_id,
      "receiving_policy_id",
      100,
    ),
    receiving_policy_hash: sha(r.receiving_policy_hash),
    decisions: decisions(r.decisions),
    price_and_unit_proposals: prices,
    proposal_signature:
      r.proposal_signature === undefined ? null : sha(r.proposal_signature),
  };
}
