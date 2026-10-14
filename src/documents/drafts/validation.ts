import {
  choice,
  common,
  commonKeys,
  invalid,
  label,
  narrative,
  object,
  uuid,
  version,
} from "../../shared/validation";
import type { Capability } from "../../platform/permissions";
import type { OutputFamily } from "../p11-template";

export const families = ["OUT-09", "OUT-10", "OUT-14"] as const;
export const familyRead = {
  "OUT-09": "pack.read",
  "OUT-10": "report.read",
  "OUT-14": "finance.read",
} as const;
// Paths describe existing projections. They are never evaluated or used as file paths.
export const bindingCatalogue: Record<
  OutputFamily,
  Record<
    string,
    {
      capability: Capability;
      audience: "Internal" | "Customer";
      source: string;
    }
  >
> = {
  "OUT-09": {
    "site.name": {
      capability: "shared.read",
      audience: "Internal",
      source: "src/documents/render.ts#PackSnapshot.site.name",
    },
    "customer.name": {
      capability: "shared.read",
      audience: "Internal",
      source: "src/documents/render.ts#PackSnapshot.customer.name",
    },
    "work.reference": {
      capability: "service.work_order.read",
      audience: "Internal",
      source: "src/documents/render.ts#PackSnapshot.work.reference",
    },
    "appointment.start_at": {
      capability: "schedule.read",
      audience: "Internal",
      source: "src/documents/render.ts#PackSnapshot.appointment.start_at",
    },
  },
  "OUT-10": {
    "site.name": {
      capability: "shared.read",
      audience: "Customer",
      source: "src/reports/render.ts#CustomerSnapshot.site.name",
    },
    "customer.name": {
      capability: "shared.read",
      audience: "Customer",
      source: "src/reports/render.ts#CustomerSnapshot.customer.name",
    },
    "work.reference": {
      capability: "service.work_order.read",
      audience: "Customer",
      source: "src/reports/render.ts#CustomerSnapshot.work.reference",
    },
    "completion.work_performed": {
      capability: "report.read",
      audience: "Customer",
      source:
        "src/reports/render.ts#CustomerSnapshot.completion.work_performed",
    },
  },
  "OUT-14": {
    site: {
      capability: "shared.finance.read",
      audience: "Internal",
      source: "src/finance/render.ts#FinanceOutput.site",
    },
    customer: {
      capability: "shared.finance.read",
      audience: "Internal",
      source: "src/finance/render.ts#FinanceOutput.customer",
    },
    work_reference: {
      capability: "service.work_order.read",
      audience: "Internal",
      source: "src/finance/render.ts#FinanceOutput.work_reference",
    },
    account: {
      capability: "finance.account.read",
      audience: "Internal",
      source: "src/finance/render.ts#FinanceOutput.account",
    },
    treatment_basis: {
      capability: "finance.read",
      audience: "Internal",
      source: "src/finance/render.ts#FinanceOutput.treatment_basis",
    },
  },
};
export function bodyInput(value: unknown, family: OutputFamily) {
  const p = object(value, ["schema_version", "title", "audience", "fields"]);
  if (p.schema_version !== 1)
    invalid("body.schema_version", "Only proposal schema 1 is supported.");
  const audience = choice(p.audience, "audience", [
    "Internal",
    "Customer",
  ] as const);
  if (family !== "OUT-10" && audience !== "Internal")
    invalid("audience", "This output family is internal only.");
  if (!Array.isArray(p.fields) || p.fields.length < 1 || p.fields.length > 40)
    invalid("fields", "Use 1–40 proposed fields.");
  const keys = new Set<string>();
  const fields = p.fields.map((value: unknown) => {
    const f = object(value, ["key", "label", "binding", "required"]);
    const key = label(f.key, "key", 64);
    if (!/^[a-z][a-z0-9_]*$/.test(key) || keys.has(key))
      invalid("key", "Use unique stable lowercase field keys.");
    keys.add(key);
    const binding = choice(
      f.binding,
      "binding",
      Object.keys(bindingCatalogue[family]),
    );
    const rule = bindingCatalogue[family][binding];
    if (audience === "Customer" && rule.audience !== "Customer")
      invalid(
        "binding",
        "Internal sources cannot appear in customer proposals.",
      );
    if (typeof f.required !== "boolean")
      invalid(
        "required",
        "Choose true or false; this is proposed requiredness only.",
      );
    return {
      key,
      label: label(f.label, "label", 120),
      binding,
      required: f.required,
    };
  });
  return {
    schema_version: 1 as const,
    title: label(p.title, "title", 200),
    audience,
    fields,
  };
}
export type ProposalBody = ReturnType<typeof bodyInput>;
export function hashInput(value: unknown, field = "content_hash") {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    invalid(field, "An exact SHA-256 is required.");
  return value;
}
export function createInput(value: unknown) {
  const p = object(value, [
    ...commonKeys,
    "id",
    "revision_id",
    "company_id",
    "site_id",
    "family",
    "base_template_id",
    "base_content_hash",
    "body",
  ]);
  const family = choice(p.family, "family", families);
  return {
    ...common(p),
    id: uuid(p.id, "id"),
    revision_id: uuid(p.revision_id, "revision_id"),
    company_id: uuid(p.company_id, "company_id"),
    site_id: uuid(p.site_id, "site_id"),
    family,
    base_template_id: uuid(p.base_template_id, "base_template_id"),
    base_content_hash: hashInput(p.base_content_hash, "base_content_hash"),
    body: bodyInput(p.body, family),
  };
}
export function reviseInput(value: unknown) {
  const p = object(value, [
    ...commonKeys,
    "revision_id",
    "observed_revision_id",
    "expected_version",
    "body",
  ]);
  return {
    ...common(p),
    revision_id: uuid(p.revision_id, "revision_id"),
    observed_revision_id: uuid(p.observed_revision_id, "observed_revision_id"),
    expected_version: version(p.expected_version),
    body: p.body,
  };
}
export function reviewInput(value: unknown) {
  const p = object(value, [
    ...commonKeys,
    "review_id",
    "revision_id",
    "content_hash",
    "expected_version",
    "outcome",
    "checks",
  ]);
  const outcome = choice(p.outcome, "outcome", [
    "Reviewed",
    "ChangesRequested",
  ] as const);
  const c = object(p.checks, ["schema", "source_bindings", "audience"]);
  const checks = Object.fromEntries(
    ["schema", "source_bindings", "audience"].map((key) => {
      const check = object(c[key], ["result", "note"]);
      const result = choice(check.result, "result", [
        "Pass",
        "Fail",
        "Blocked",
        "NotRun",
      ] as const);
      if (outcome === "Reviewed" && result !== "Pass")
        invalid(
          "checks",
          "Reviewed requires a Pass observation for every check.",
        );
      return [key, { result, note: narrative(check.note, "note", 2000) }];
    }),
  );
  return {
    ...common(p),
    review_id: uuid(p.review_id, "review_id"),
    revision_id: uuid(p.revision_id, "revision_id"),
    content_hash: hashInput(p.content_hash),
    expected_version: version(p.expected_version),
    outcome,
    checks,
  };
}
