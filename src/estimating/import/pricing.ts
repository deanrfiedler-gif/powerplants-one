import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { transaction } from "../../platform/database";
import { canonical, sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import { uuid } from "../../shared/validation";
import { expected } from "../service";
import { costingInput } from "../cost-basis-validation";
import { compareSourceRefresh, writeSourceRefresh } from "../sources/refresh";
import { refreshProposal, refreshCommand } from "../sources/validation";
import { EXCEL_CAPACITY } from "./capacity";
import { excelVersionAuthority } from "./pricing-context";
import { readReviewTarget } from "./service";
import { reviewHash } from "./review";

export const excelPricingCommand = "ExcelImport:PriceSources";
export const excelPricingRequestLimit = 256 * 1024;

async function compare(
  c: PoolClient,
  p: Principal,
  id: string,
  input: ReturnType<typeof refreshProposal>,
  reason = "測".repeat(1000),
) {
  const origin = await excelVersionAuthority(
    c,
    p,
    id,
    input.estimate_version_id,
    true,
  );
  const basis = await readReviewTarget(
    c,
    p,
    origin.estimating_workspace_id,
    origin.option_id,
    origin.revision_id,
  );
  if (basis.target.estimate_version_id !== input.estimate_version_id)
    throw new AppError(
      409,
      "EstimateVersionChanged",
      "Review pricing against the current saved Excel estimate.",
    );
  const compared = await compareSourceRefresh(
    c,
    p,
    id,
    input,
    EXCEL_CAPACITY.lines,
  );
  const { e, v, comparison } = compared;
  // Validate the complete 1 MiB receiver envelope, not just the selected lines.
  costingInput(
    origin.estimating_workspace_id,
    {
      schema_version: 1,
      operation_id: v.id,
      reason,
      estimate_id: id,
      option_id: origin.option_id,
      revision_id: origin.revision_id,
      expected_workspace_version: basis.target.expected_workspace_version,
      expected_estimate_version: e.version,
      context_hash: basis.target.context_hash,
      title: v.title,
      scope: v.scope,
      policy: v.policy,
      lines: comparison.lines,
    },
    EXCEL_CAPACITY,
  );
  const mappings = (
    await c.query<{ line_id: string; line_ref: string }>(
      "SELECT line_id,line_ref FROM ppo.excel_line_history WHERE workspace_id=$1 AND estimate_version_id=$2 ORDER BY ordinal",
      [p.workspace_id, origin.estimate_version_id],
    )
  ).rows;
  const snapshot = {
    pricing_version: "PPO-EXCEL-SOURCE-PRICING-1",
    actor_id: p.actor_id,
    basis_hash: basis.basis_hash,
    proposal: input,
    import_version_id: origin.estimate_version_id,
    import_review_hash: origin.review_hash,
    workbook: origin.review.file,
    workbook_ref: origin.review.metadata.workbook_ref,
    workbook_values: comparison.changes.map((change) => {
      const mapping = mappings.find((m) => m.line_id === change.line_id);
      const original = origin.review.lines.find(
        (l) => l.line_ref === mapping?.line_ref,
      );
      return {
        line_id: change.line_id,
        line_ref: mapping?.line_ref ?? null,
        original: original ?? null,
      };
    }),
    comparison,
  };
  return {
    ...compared,
    origin,
    review: { ...snapshot, review_hash: reviewHash(snapshot) },
  };
}
export async function previewExcelSourcePricing(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = refreshProposal(value, EXCEL_CAPACITY.lines);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    return (await compare(c, p, uuid(id, "estimate_id"), input)).review;
  });
}
export async function excelPricingReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operationId: string,
) {
  const row = (
    await c.query<{ estimate_version_id: string }>(
      "SELECT estimate_version_id FROM ppo.excel_source_pricings WHERE workspace_id=$1 AND estimate_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operationId],
    )
  ).rows[0];
  if (!row) throw unavailable();
  return excelVersionAuthority(c, p, id, row.estimate_version_id, true);
}
export async function applyExcelSourcePricing(
  p: Principal,
  id: string,
  value: unknown,
) {
  // The native command shape is reused; comparison_hash binds the full Excel review.
  const input = refreshCommand(id, value, EXCEL_CAPACITY.lines);
  return sharedOperation(
    p,
    input,
    excelPricingCommand,
    async (c) => {
      const prior = (
        await c.query(
          "SELECT 1 FROM ppo.excel_source_pricings WHERE workspace_id=$1 AND created_by=$2 AND operation_id=$3",
          [p.workspace_id, p.actor_id, input.operation_id],
        )
      ).rowCount;
      if (prior)
        return excelPricingReceiptAuthority(c, p, id, input.operation_id);
      return excelVersionAuthority(
        c,
        p,
        id,
        input.proposal.estimate_version_id,
        true,
      );
    },
    async (c) => {
      const compared = await compare(c, p, id, input.proposal, input.reason);
      expected(compared.e.version, input.expected_version);
      if (compared.review.review_hash !== input.comparison_hash)
        throw new AppError(
          409,
          "ExcelPricingReviewChanged",
          "Review the exact workbook, current estimate and source choices again before saving.",
        );
      const result = await writeSourceRefresh(c, p, input, compared);
      const receipt_id = randomUUID(),
        audit_event_id = randomUUID();
      const { review_hash, ...document } = compared.review;
      await c.query(
        `INSERT INTO ppo.excel_source_pricings
      (workspace_id,company_id,estimate_id,estimate_version_id,predecessor_id,import_version_id,
       operation_id,receipt_id,audit_event_id,review,canonical_review,review_hash,created_by,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          p.workspace_id,
          compared.e.company_id,
          id,
          result.current_version_id,
          compared.v.id,
          compared.origin.estimate_version_id,
          input.operation_id,
          receipt_id,
          audit_event_id,
          compared.review,
          canonical(document),
          review_hash,
          p.actor_id,
          input.reason,
        ],
      );
      return {
        ...result,
        receipt_id,
        audit_event_id,
        audit_details: {
          ...result.audit_details,
          excel_pricing: {
            review_hash,
            import_version_id: compared.origin.estimate_version_id,
          },
        },
      };
    },
    "Estimate",
    "EstimateVersionSaved",
  );
}
export async function readExcelSourcePricing(
  p: Principal,
  id: string,
  versionId: string,
) {
  return transaction(async (c) => {
    await excelVersionAuthority(
      c,
      p,
      uuid(id, "estimate_id"),
      uuid(versionId, "version_id"),
    );
    const row = (
      await c.query(
        "SELECT estimate_version_id,predecessor_id,import_version_id,operation_id,receipt_id,review,review_hash,created_by,created_at,reason FROM ppo.excel_source_pricings WHERE workspace_id=$1 AND estimate_id=$2 AND estimate_version_id=$3",
        [p.workspace_id, id, versionId],
      )
    ).rows[0];
    if (!row) throw unavailable();
    return { state: "Priced", synthetic: true, durable: true, ...row };
  });
}
