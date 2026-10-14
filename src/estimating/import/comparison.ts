import { EXCEL_CAPACITY } from "./capacity";
import type { QueryClient } from "../../platform/permissions";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import { invalid, object, uuid } from "../../shared/validation";
import { sourceBindings } from "../sources/bindings";
import type { EstimateVersion } from "../context";
import { calculate, decimal, extended, scaled, type CostLine } from "../math";
import { previewExcelWorkbook, readReviewTarget } from "./service";
import { reviewHash, type reviewWorkbook } from "./review";
import { retainedAuthority } from "./retained";

export type WorkbookReview = ReturnType<typeof reviewWorkbook>;
export type ImportHistory = {
  estimate_version_id: string;
  review: WorkbookReview;
  version: number;
};
export type ImportMapping = {
  estimate_version_id: string;
  line_ref: string;
  line_id: string;
};
export type LineDecision = { line_id: string; action: "Keep" | "Remove" };
export type Projection = {
  line: CostLine;
  line_ref: string | null;
  retained_from: string | null;
};
export const comparisonVersion = "PPO-EXCEL-COMPARE-1";
export function mismatch() {
  return new AppError(
    409,
    "ExcelImportComparisonChanged",
    "Compare the current estimate and exact workbook again before saving.",
  );
}
export function workbookLine(
  l: WorkbookReview["lines"][number],
  id: string,
): CostLine {
  // Only called after whole-workbook validation; the receiver independently validates the projection.
  return {
    id,
    description: l.description!,
    category: l.category as CostLine["category"],
    allowance: l.allowance!,
    quantity: l.quantity!,
    unit: l.unit!,
    unit_cost: l.unit_cost!,
    unit_sell: l.unit_sell!,
    source: l.source_text!,
    effective_date: l.effective_date!,
  };
}
function newLineId(
  workspaceId: string,
  optionId: string,
  workbookRef: string,
  lineRef: string,
) {
  const h = reviewHash([
    comparisonVersion,
    workspaceId,
    optionId,
    workbookRef,
    lineRef,
  ]);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
function same(a: unknown, b: unknown) {
  return reviewHash(a) === reviewHash(b);
}
function comparable(line: CostLine) {
  return {
    ...line,
    quantity: decimal(scaled(line.quantity, 3), 3),
    unit_cost: decimal(scaled(line.unit_cost, 2)),
    unit_sell: decimal(scaled(line.unit_sell, 2)),
    cost: decimal(extended(line.quantity, line.unit_cost)),
    sell: decimal(extended(line.quantity, line.unit_sell)),
  };
}
function difference(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
) {
  return [
    ...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  ]
    .filter((k) => !same(before?.[k] ?? null, after?.[k] ?? null))
    .map((field) => ({
      field,
      before: before?.[field] ?? null,
      after: after?.[field] ?? null,
    }));
}
function provenance(review: WorkbookReview, lineRef: string) {
  const l = review.lines.find((l) => l.line_ref === lineRef)!;
  const clean = (value: unknown) => {
    if (!value) return null;
    const { locator: _locator, ...fields } = value as Record<string, unknown>;
    void _locator;
    return fields;
  };
  return {
    section: clean(
      review.sections.find((s) => s.section_ref === l.section_ref),
    ),
    source: clean(review.sources.find((s) => s.source_ref === l.source_ref)),
    included: l.included,
    print: l.print,
  };
}
export function buildComparison(
  workspaceId: string,
  review: WorkbookReview,
  current: EstimateVersion,
  history: ImportHistory[],
  mappings: ImportMapping[],
) {
  if (!review.validation_passed)
    throw new AppError(
      422,
      "ExcelImportBlocked",
      "Resolve every workbook validation error before comparing.",
    );
  if (!history.length)
    throw new AppError(
      409,
      "ExcelImportOriginalRequired",
      "This option requires an accepted original workbook before re-import.",
    );
  if (
    history.some(
      (h) => h.review.metadata.workbook_ref !== review.metadata.workbook_ref,
    )
  )
    throw new AppError(
      409,
      "ExcelImportWorkbookChanged",
      "Use the same workbook identity for this option's revised workbook.",
    );
  const known = new Map<string, ImportMapping>();
  for (const m of mappings)
    if (!known.has(m.line_ref)) known.set(m.line_ref, m);
  const byId = new Map([...known.values()].map((m) => [m.line_id, m]));
  const incoming = review.lines.map((l) => {
    const m = known.get(l.line_ref!),
      id =
        m?.line_id ??
        newLineId(
          workspaceId,
          review.basis.option_id,
          review.metadata.workbook_ref!,
          l.line_ref!,
        );
    const before = current.lines.find((l) => l.id === id) ?? null,
      proposed = workbookLine(l, id);
    const prior = m
      ? history.find((h) => h.estimate_version_id === m.estimate_version_id)!
      : null;
    const previous = prior
      ? prior.review.lines.find((old) => old.line_ref === l.line_ref)!
      : null;
    const beforeProvenance = prior
      ? provenance(prior.review, l.line_ref!)
      : null;
    const afterProvenance = provenance(review, l.line_ref!);
    const changes = [
      ...difference(before ? comparable(before) : null, comparable(proposed)),
      ...difference(beforeProvenance, afterProvenance),
    ];
    return {
      line_id: id,
      line_ref: l.line_ref!,
      kind: !before ? "Added" : changes.length ? "Changed" : "Unchanged",
      before,
      proposed,
      previous_workbook: previous,
      previous_import_version_id: m?.estimate_version_id ?? null,
      provenance_before: beforeProvenance,
      provenance_after: afterProvenance,
      changes,
    };
  });
  const omissions = current.lines
    .filter((l) => !incoming.some((n) => n.line_id === l.id))
    .map((line) => ({
      line_id: line.id,
      kind: byId.has(line.id) ? "RemovedImported" : "PPOOnly",
      before: line,
      previous_import_version_id:
        byId.get(line.id)?.estimate_version_id ?? null,
      line_ref: byId.get(line.id)?.line_ref ?? null,
      decision_required: true,
    }));
  const prior = history[0];
  const result = {
    comparison_version: comparisonVersion,
    state: "ComparisonRequired",
    synthetic: true,
    durable: false,
    proposal: review,
    predecessor: {
      estimate_id: current.estimate_id,
      version_id: current.id,
      version: current.version,
      content_hash: current.content_hash,
      title: current.title,
      scope: current.scope,
      lines: current.lines,
      totals: calculate(current.lines),
    },
    ...(current.source_bindings?.length ? {
      source_binding_changes: current.source_bindings.map(binding => {
        const next = incoming.find(l => l.line_id === binding.line_id)?.proposed;
        const before = current.lines.find(l => l.id === binding.line_id)!;
        const preserved = next && (["quantity", "unit", "unit_cost", "source", "effective_date"] as const)
          .every(k => next[k] === before[k]);
        return { binding, action: next ? (preserved ? "Preserved" : "Removed") : "KeepOrRemoveRequired" };
      }),
    } : {}),
    previous_import: {
      version_id: prior.estimate_version_id,
      review_hash: prior.review.review_hash,
      file: prior.review.file,
    },
    lines: incoming,
    omissions,
    changes: {
      title: { before: current.title, after: review.metadata.title },
      scope: { before: current.scope, after: review.scope_comparison },
      sections: { before: prior.review.sections, after: review.sections },
      sources: { before: prior.review.sources, after: review.sources },
      metadata: { before: prior.review.metadata, after: review.metadata },
      totals: { before: calculate(current.lines), workbook: review.totals },
    },
  };
  return { ...result, comparison_hash: reviewHash(result) };
}
export type WorkbookComparison = ReturnType<typeof buildComparison>;
export async function compareReviewed(
  c: QueryClient,
  p: Principal,
  review: WorkbookReview,
) {
  const basis = await readReviewTarget(
    c,
    p,
    review.basis.workspace_id,
    review.basis.option_id,
    review.basis.revision_id,
  );
  if (
    basis.basis_hash !== reviewHash(review.basis) ||
    basis.today !== review.evaluated_on
  )
    throw mismatch();
  if (!basis.target.estimate_id || !basis.target.estimate_version_id)
    throw new AppError(
      409,
      "ExcelImportOriginalRequired",
      "Save the first reviewed workbook before comparing a revision.",
    );
  const current = (
    await c.query<EstimateVersion>(
      "SELECT * FROM ppo.estimate_versions WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, basis.target.estimate_version_id],
    )
  ).rows[0];
  const history = (
    await c.query<ImportHistory>(
      "SELECT estimate_version_id,review,version FROM ppo.excel_import_history WHERE workspace_id=$1 AND estimate_id=$2 ORDER BY version DESC LIMIT 101",
      [p.workspace_id, current.estimate_id],
    )
  ).rows;
  if (history.length > 100)
    throw new AppError(
      422,
      "ExcelImportHistoryLimit",
      "This bounded pilot supports comparison across up to 100 accepted workbooks per option.",
    );
  for (const h of history)
    await retainedAuthority(
      c,
      p,
      current.estimate_id,
      h.estimate_version_id,
      true,
    );
  const mappings = (
    await c.query<ImportMapping>(
      "SELECT estimate_version_id,line_ref,line_id FROM ppo.excel_line_history WHERE workspace_id=$1 AND estimate_id=$2 ORDER BY version DESC,ordinal",
      [p.workspace_id, current.estimate_id],
    )
  ).rows;
  const bindings = await sourceBindings(c, p, current.id);
  if (bindings.length) current.source_bindings = bindings;
  return buildComparison(p.workspace_id, review, current, history, mappings);
}
export async function compareExcelWorkbook(
  p: Principal,
  id: string,
  value: unknown,
) {
  const review = await previewExcelWorkbook(p, id, value);
  return transaction((c) => compareReviewed(c, p, review));
}
export function lineDecisions(value: unknown): LineDecision[] {
  if (!Array.isArray(value) || value.length > EXCEL_CAPACITY.lines)
    invalid(
      "decisions",
      "Provide one Keep or Remove decision for each omitted current line.",
    );
  const result = value.map((v) => {
    const r = object(v, ["line_id", "action"]);
    if (r.action !== "Keep" && r.action !== "Remove")
      invalid("action", "Choose Keep or Remove.");
    return {
      line_id: uuid(r.line_id, "line_id"),
      action: r.action as LineDecision["action"],
    };
  });
  if (new Set(result.map((d) => d.line_id)).size !== result.length)
    invalid("decisions", "Each omitted line needs exactly one decision.");
  return result.sort((a, b) => a.line_id.localeCompare(b.line_id));
}
export function projectComparison(
  comparison: WorkbookComparison,
  decisions: LineDecision[],
): Projection[] {
  if (
    decisions.length !== comparison.omissions.length ||
    comparison.omissions.some(
      (o) => !decisions.some((d) => d.line_id === o.line_id),
    )
  )
    throw new AppError(
      422,
      "ExcelImportDecisionsRequired",
      "Choose Keep or Remove for every removed or PPO-only line, with no extra decisions.",
    );
  return [
    ...comparison.lines.map((l) => ({
      line: l.proposed,
      line_ref: l.line_ref,
      retained_from: null,
    })),
    ...comparison.omissions
      .filter(
        (o) =>
          decisions.find((d) => d.line_id === o.line_id)!.action === "Keep",
      )
      .map((o) => ({
        line: o.before,
        line_ref: null,
        retained_from: o.previous_import_version_id,
      })),
  ];
}
