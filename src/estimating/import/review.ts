import { createHash } from "node:crypto";
import { canonical } from "../../platform/operations";
import { arithmeticPolicy, decimal, extended, scaled } from "../math";
import type { DiscoveryInput } from "../discovery";
import type {
  ParsedWorkbook,
  WorkbookLocator,
  WorkbookRow,
  WorkbookTable,
} from "./reader";
import {
  workbookBoolean,
  workbookDate,
  workbookNumber,
  workbookText,
} from "./values";

export const mappingVersion = "PPO-EXCEL-REVIEW-1";
export const reviewHash = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
export type ReviewTarget = {
  workspace_id: string;
  company_id: string;
  actor_id: string;
  opportunity_id: string;
  organisation_id: string;
  site_id: string;
  option_id: string;
  revision_id: string;
  expected_workspace_version: number;
  expected_estimate_version: number;
  estimate_id: string | null;
  estimate_version_id: string | null;
  content_hash: string;
  context_hash: string;
  discovery: DiscoveryInput;
};
export type WorkbookIssue = {
  severity: "Error" | "Warning";
  code: string;
  field: string;
  locator: WorkbookLocator | null;
  message: string;
};
const metadataKeys = [
  "schema_version",
  "template_ref",
  "template_revision",
  "workbook_ref",
  "workbook_revision",
  "opportunity_ref",
  "option_ref",
  "organisation_ref",
  "site_ref",
  "title",
  "estimator",
  "currency",
  "tax_basis",
  "calculation_policy",
  "data_mode",
  "formula_reviewed_by",
  "formula_reviewed_at",
];
const controlKeys = [
  "line_count",
  "workbook_cost",
  "workbook_sell",
  "included_sell",
];
const categories = [
  "Product",
  "Labour",
  "Freight",
  "Engineering",
  "Subcontract",
];
const units = ["ea", "m", "m2", "m3", "h", "lot"];
const placeholderId = "00000000-0000-4000-8000-000000000000";

export function reviewWorkbook(
  book: ParsedWorkbook,
  target: ReviewTarget,
  today: string,
) {
  const issues: WorkbookIssue[] = [];
  function issue(
    code: string,
    field: string,
    message: string,
    row?: WorkbookRow,
    severity: WorkbookIssue["severity"] = "Error",
  ) {
    issues.push({
      severity,
      code,
      field,
      message,
      locator: row?.locator ?? null,
    });
  }
  function text(row: WorkbookRow, field: string, max = 200, optional = false) {
    let value = workbookText(row.cells[field], max, optional);
    if (
      value !== null &&
      !["text", "internal_notes"].includes(field) &&
      /[\r\n\t]/.test(value)
    )
      value = null;
    if (value === null)
      issue(
        "InvalidText",
        field,
        `Use ${optional ? "optional" : "nonempty"} text within ${max} characters.`,
        row,
      );
    return value;
  }
  function date(row: WorkbookRow, field: string, optional = false) {
    if (optional && row.cells[field]?.kind === "blank") return null;
    const value = workbookDate(row.cells[field]);
    if (!value)
      issue(
        "InvalidDate",
        field,
        "Use an ISO calendar date or integral Excel date; day 60 and fractional dates are unsupported.",
        row,
      );
    return value;
  }
  function number(
    row: WorkbookRow,
    field: string,
    places: number,
    max: bigint,
    positive = false,
  ) {
    const value = workbookNumber(row.cells[field], places, max, positive);
    if (value === null)
      issue(
        "InvalidNumber",
        field,
        `Use a typed ${positive ? "positive" : "nonnegative"} number with at most ${places} meaningful decimal places within the pilot limit. Blank is unknown.`,
        row,
      );
    return value;
  }
  function bool(row: WorkbookRow, field: string) {
    const value = workbookBoolean(row.cells[field]);
    if (value === null)
      issue(
        "InvalidChoice",
        field,
        "Record an explicit Yes/No or Boolean choice.",
        row,
      );
    return value;
  }
  function keyed(table: WorkbookTable, field: string, allowed?: string[]) {
    const map = new Map<string, WorkbookRow>();
    for (const row of book.tables[table]) {
      const key = text(row, field);
      if (key === null) continue;
      if (map.has(key))
        issue("DuplicateKey", field, "Use this exact key once.", row);
      else map.set(key, row);
      if (allowed && !allowed.includes(key))
        issue(
          "UnknownKey",
          field,
          "This key is outside the workbook contract.",
          row,
        );
    }
    for (const key of allowed ?? [])
      if (!map.has(key))
        issue("MissingKey", key, `Missing ${table} key: ${key}.`);
    return map;
  }
  const metadataRows = keyed("PPO_Metadata", "field", metadataKeys);
  const metadata: Record<string, string | null> = Object.create(null);
  for (const [key, row] of metadataRows) metadata[key] = text(row, "value");
  const expected: Record<string, string> = {
    schema_version: "1",
    template_ref: "PPO-EST-WORKBOOK",
    template_revision: "r01",
    opportunity_ref: target.opportunity_id,
    option_ref: target.option_id,
    organisation_ref: target.organisation_id,
    site_ref: target.site_id,
    currency: "AUD",
    tax_basis: "ExcludingTax",
    calculation_policy: arithmeticPolicy,
    data_mode: "Synthetic",
  };
  for (const [key, value] of Object.entries(expected))
    if (metadata[key] !== value)
      issue(
        "MetadataMismatch",
        key,
        "The workbook declaration must match the exact native target or supported pilot contract.",
        metadataRows.get(key),
      );
  if (metadataRows.has("formula_reviewed_at"))
    date(metadataRows.get("formula_reviewed_at")!, "value");

  const sectionRows = keyed("PPO_Sections", "section_ref");
  if (!sectionRows.size)
    issue("MissingSections", "PPO_Sections", "Include at least one section.");
  const sections = [...sectionRows].map(([section_ref, row]) => {
    const label = text(row, "label"),
      facility_ref = text(row, "facility_ref", 200, true),
      growing_area_ref = text(row, "growing_area_ref", 200, true),
      system = text(row, "system"),
      phase = text(row, "phase");
    if (
      facility_ref &&
      !target.discovery.scope.facility_ids.includes(facility_ref)
    )
      issue(
        "FacilityOutsideScope",
        "facility_ref",
        "Use an exact Facility ID in the selected discovery scope.",
        row,
      );
    if (growing_area_ref) {
      const area = target.discovery.configuration?.areas.find(
        (a) => a.id === growing_area_ref && a.purpose === "Growing",
      );
      if (
        !area ||
        (area.facility_id !== null &&
          !target.discovery.scope.facility_ids.includes(area.facility_id)) ||
        (facility_ref && area.facility_id !== facility_ref)
      )
        issue(
          "AreaOutsideScope",
          "growing_area_ref",
          "Use an exact Growing area in this discovery revision and compatible Facility.",
          row,
        );
    }
    return {
      section_ref,
      label,
      facility_ref,
      growing_area_ref,
      system,
      phase,
      locator: row.locator,
    };
  });

  keyed("PPO_Scope", "scope_ref");
  const scope = book.tables.PPO_Scope.map((row) => {
    const kind = text(row, "kind"),
      value = text(row, "text", 2000);
    if (!["Inclusion", "Exclusion", "Assumption"].includes(kind ?? ""))
      issue(
        "InvalidScopeKind",
        "kind",
        "Choose Inclusion, Exclusion or Assumption.",
        row,
      );
    return {
      scope_ref: workbookText(row.cells.scope_ref, 200),
      kind,
      text: value,
      locator: row.locator,
    };
  });
  const scopeComparison = (
    ["Inclusion", "Exclusion", "Assumption"] as const
  ).map((kind, i) => {
    const answer = target.discovery.answers.find(
      (a) => a.question_id === `Q0${i + 1}`,
    );
    const current =
      typeof answer?.value === "string"
        ? answer.value
        : answer?.value &&
            typeof answer.value === "object" &&
            answer.value.choice === "NoneDeclared"
          ? ""
          : null;
    const rows = scope.filter((s) => s.kind === kind);
    const proposed = rows.some((s) => s.text === null)
      ? null
      : rows.map((s) => s.text).join("\n");
    const matches =
      current !== null && proposed !== null && current === proposed;
    if (proposed !== null && proposed.length > (i === 0 ? 3000 : 2000))
      issue(
        "ScopeTooLong",
        kind,
        "The complete scope narrative exceeds the native receiver limit.",
      );
    if (!matches)
      issue(
        "ScopeChanged",
        kind,
        "Workbook scope differs from the exact E2 answer. Review and save an E2 successor before continuing.",
      );
    return { kind, question_id: `Q0${i + 1}`, current, proposed, matches };
  });

  const sourceRows = keyed("PPO_Sources", "source_ref");
  const sources = [...sourceRows].map(([source_ref, row]) => {
    const source_kind = text(row, "source_kind"),
      supplier_label = text(row, "supplier_label", 200, true),
      document_ref = text(row, "document_ref", 200, true),
      source_date = date(row, "source_date"),
      valid_until = date(row, "valid_until", true),
      internal_notes = text(row, "internal_notes", 2000, true);
    if (!["SupplierQuote", "Manual"].includes(source_kind ?? ""))
      issue(
        "UnsupportedSourceKind",
        "source_kind",
        "This pilot supports SupplierQuote and Manual provenance.",
        row,
      );
    if (valid_until && source_date && valid_until < source_date)
      issue(
        "InvalidValidity",
        "valid_until",
        "Validity cannot end before the source date.",
        row,
      );
    if (!valid_until)
      issue(
        "SourceValidityUnknown",
        "valid_until",
        "Source validity is unknown and requires review.",
        row,
        "Warning",
      );
    else if (valid_until < today)
      issue(
        "SourceExpired",
        "valid_until",
        "This declared source has expired and requires review.",
        row,
        "Warning",
      );
    return {
      source_ref,
      source_kind,
      supplier_label,
      document_ref,
      source_date,
      valid_until,
      internal_notes,
      locator: row.locator,
    };
  });

  keyed("PPO_Lines", "line_ref");
  if (!book.tables.PPO_Lines.length || book.tables.PPO_Lines.length > 100)
    issue("LineCount", "PPO_Lines", "Use one to 100 populated lines.");
  const lines = book.tables.PPO_Lines.map((row) => {
    const line_ref = workbookText(row.cells.line_ref, 200),
      section_ref = text(row, "section_ref"),
      description = text(row, "description", 300),
      category = text(row, "category"),
      unit = text(row, "unit", 40),
      quantity = number(row, "quantity", 3, 100000000n, true),
      unit_cost = number(row, "unit_cost", 2, 100000000n),
      unit_sell = number(row, "unit_sell", 2, 100000000n),
      allowance = bool(row, "allowance"),
      source_ref = text(row, "source_ref"),
      source_date = date(row, "source_date"),
      included = bool(row, "include"),
      print = bool(row, "print"),
      source_sheet = text(row, "source_sheet", 31),
      source_row = number(row, "source_row", 0, 1048576n, true),
      workbook_cost = number(row, "workbook_cost", 2, 10000000000000n),
      workbook_sell = number(row, "workbook_sell", 2, 10000000000000n);
    if (!categories.includes(category ?? ""))
      issue(
        "UnknownCategory",
        "category",
        "Use a supported schema-2 category.",
        row,
      );
    if (!units.includes(unit ?? ""))
      issue(
        "UnknownUnit",
        "unit",
        "Use ea, m, m2, m3, h or lot; no unit conversion is inferred.",
        row,
      );
    if (!section_ref || !sectionRows.has(section_ref))
      issue(
        "UnknownSection",
        "section_ref",
        "Resolve this line to one workbook section.",
        row,
      );
    const source = sources.find((s) => s.source_ref === source_ref);
    if (!source)
      issue(
        "UnknownSource",
        "source_ref",
        "Resolve this line to one workbook source.",
        row,
      );
    else if (source_date !== source.source_date)
      issue(
        "SourceDateMismatch",
        "source_date",
        "Line and source dates must agree.",
        row,
      );
    if (
      unit_cost !== null &&
      unit_sell !== null &&
      scaled(unit_sell, 2) < scaled(unit_cost, 2)
    )
      issue(
        "BelowCost",
        "unit_sell",
        "Sell cannot be below cost under the existing synthetic policy.",
        row,
      );
    const cost =
        quantity !== null && unit_cost !== null
          ? decimal(extended(quantity, unit_cost))
          : null,
      sell =
        quantity !== null && unit_sell !== null
          ? decimal(extended(quantity, unit_sell))
          : null;
    const cost_difference =
        cost !== null && workbook_cost !== null
          ? decimal(scaled(cost, 2) - scaled(workbook_cost, 2))
          : null,
      sell_difference =
        sell !== null && workbook_sell !== null
          ? decimal(scaled(sell, 2) - scaled(workbook_sell, 2))
          : null;
    if (cost_difference !== null && cost_difference !== "0.00")
      issue(
        "LineCostMismatch",
        "workbook_cost",
        "The saved line cost differs from PPO's rounded extension.",
        row,
      );
    if (sell_difference !== null && sell_difference !== "0.00")
      issue(
        "LineSellMismatch",
        "workbook_sell",
        "The saved line sell differs from PPO's rounded extension.",
        row,
      );
    const source_text = source
      ? [source.source_kind, source.supplier_label, source.document_ref]
          .filter(Boolean)
          .join(" · ")
      : null;
    if (source_text && source_text.length > 500)
      issue(
        "SourceProjectionTooLong",
        "source_ref",
        "The source description exceeds the native 500-character limit.",
        row,
      );
    return {
      line_ref,
      section_ref,
      description,
      category,
      quantity,
      unit,
      unit_cost,
      unit_sell,
      allowance,
      source_ref,
      source_text,
      effective_date: source_date,
      included,
      print,
      declared_origin: { sheet: source_sheet, row: source_row },
      workbook_cost,
      workbook_sell,
      cost,
      sell,
      cost_difference,
      sell_difference,
      locator: row.locator,
    };
  });
  const sum = (rows: typeof lines, field: "cost" | "sell") =>
    !rows.length || rows.some((l) => l[field] === null)
      ? null
      : decimal(rows.reduce((n, l) => n + scaled(l[field]!, 2), 0n));
  const totals = {
    line_count: lines.length,
    cost: sum(lines, "cost"),
    sell: sum(lines, "sell"),
    included_sell:
      !lines.length ||
      lines.some((l) => l.included === null || (l.included && l.sell === null))
        ? null
        : decimal(
            lines.reduce(
              (n, l) => n + (l.included ? scaled(l.sell!, 2) : 0n),
              0n,
            ),
          ),
  };
  const sectionTotals = sections.map((s) => ({
    section_ref: s.section_ref,
    cost: sum(
      lines.filter((l) => l.section_ref === s.section_ref),
      "cost",
    ),
    sell: sum(
      lines.filter((l) => l.section_ref === s.section_ref),
      "sell",
    ),
  }));
  const controls = keyed("PPO_Control", "control", controlKeys);
  const reconciliation = controlKeys.map((key) => {
    const row = controls.get(key),
      count = key === "line_count";
    const workbook = row
      ? number(row, "value", count ? 0 : 2, count ? 100n : 1000000000000000n)
      : null;
    const calculated = count
      ? String(totals.line_count)
      : key === "workbook_cost"
        ? totals.cost
        : key === "workbook_sell"
          ? totals.sell
          : totals.included_sell;
    const matches =
      workbook !== null && calculated !== null && workbook === calculated;
    if (!matches)
      issue(
        "ControlMismatch",
        key,
        "The full control value must match a complete PPO calculation.",
        row,
      );
    return {
      control: key,
      workbook,
      calculated,
      matches,
      difference:
        workbook !== null && calculated !== null
          ? count
            ? String(BigInt(calculated) - BigInt(workbook))
            : decimal(scaled(calculated, 2) - scaled(workbook, 2))
          : null,
    };
  });
  // Estimate the exact receiver envelope conservatively, reserving maximum reason length.
  // These placeholder IDs are sizing only; this preview allocates no domain identities.
  const receiverBytes = Buffer.byteLength(
    canonical({
      schema_version: 1,
      operation_id: placeholderId,
      estimate_id: target.estimate_id ?? placeholderId,
      option_id: target.option_id,
      revision_id: target.revision_id,
      reason: "x".repeat(1000),
      expected_workspace_version: target.expected_workspace_version,
      expected_estimate_version: target.expected_estimate_version,
      context_hash: target.context_hash,
      title: metadata.title,
      policy: arithmeticPolicy,
      scope: Object.fromEntries(
        ["included", "excluded", "assumptions"].map((key, i) => [
          key,
          scopeComparison[i].proposed,
        ]),
      ),
      lines: lines.map((l) => ({
        id: placeholderId,
        description: l.description,
        category: l.category,
        allowance: l.allowance,
        quantity: l.quantity,
        unit: l.unit,
        unit_cost: l.unit_cost,
        unit_sell: l.unit_sell,
        source: l.source_text,
        effective_date: l.effective_date,
      })),
    }),
    "utf8",
  );
  if (receiverBytes > 65536)
    issue(
      "ReceiverPayloadTooLarge",
      "lines",
      "The whole proposed estimate exceeds the 64 KiB receiving limit; no partial import is permitted.",
    );
  const result = {
    mapping_version: mappingVersion,
    parser: book.parser,
    file: book.file,
    formula_count: book.formula_count,
    basis: target,
    evaluated_on: today,
    metadata,
    sections,
    scope,
    scope_comparison: scopeComparison,
    sources,
    lines,
    totals,
    section_totals: sectionTotals,
    reconciliation,
    issues,
    original_tables: book.tables,
    receiver_bytes_upper_bound: receiverBytes,
    validation_passed: !issues.some((i) => i.severity === "Error"),
    state: issues.some((i) => i.severity === "Error")
      ? ("Blocked" as const)
      : ("ReviewRequired" as const),
    review: {
      recorded: false,
      required: [
        "SourceCalculation",
        "Scope",
        "Reconciliation",
        "SourceWarnings",
      ],
    },
    durable: false,
    can_import: false,
    synthetic: true,
  };
  return { ...result, review_hash: reviewHash(result) };
}
