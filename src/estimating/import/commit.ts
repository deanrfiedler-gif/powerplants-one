import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import type { DocumentStoreAdapter } from "../../adapters/contracts";
import { transaction } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import {
  canonical,
  lockOperation,
  priorReceipt,
  sharedOperation,
} from "../../platform/operations";
import {
  common,
  commonKeys,
  invalid,
  object,
  uuid,
} from "../../shared/validation";
import { documentStore, digest } from "../../documents/store";
import {
  workspaceAuthority,
  revisionAuthority,
} from "../discovery-workspace-context";
import { estimateContext } from "../context";
import { writeDiscoveryCosting } from "../cost-basis-service";
import { costingInput } from "../cost-basis-validation";
import { arithmeticPolicy } from "../math";
import { decodeExcelFile, readReviewTarget } from "./service";
import { readWorkbook } from "./reader";
import { WorkbookRejected } from "./archive";
import { reviewHash, reviewWorkbook } from "./review";

export const excelCommitCommand = "ExcelImport:Commit";
export const excelConfirmations = [
  "SourceCalculation",
  "Scope",
  "Reconciliation",
  "SourceWarnings",
] as const;
export function hashField(value: unknown, field: string) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    invalid(field, "Use the exact reviewed hash.");
  return value;
}
export function excelCommitInput(id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "option_id",
    "revision_id",
    "basis_hash",
    "review_hash",
    "confirmations",
    "file",
  ]);
  const confirmations = r.confirmations;
  if (
    !Array.isArray(confirmations) ||
    confirmations.length !== excelConfirmations.length ||
    new Set(confirmations).size !== excelConfirmations.length ||
    excelConfirmations.some((k) => !confirmations.includes(k))
  )
    invalid(
      "confirmations",
      "Confirm source calculation, scope, reconciliation and source warnings for this exact review.",
    );
  return {
    input: {
      ...common(r),
      id: uuid(id, "workspace_id"),
      option_id: uuid(r.option_id, "option_id"),
      revision_id: uuid(r.revision_id, "revision_id"),
      basis_hash: hashField(r.basis_hash, "basis_hash"),
      review_hash: hashField(r.review_hash, "review_hash"),
      confirmations: [...excelConfirmations],
    },
    file: r.file,
  };
}
// Separate storage namespace prevents one actor or document command from claiming another's object.
export function excelStorageOperation(p: Principal, operationId: string) {
  const h = createHash("sha256")
    .update(
      canonical([
        "ExcelImport:Source:1",
        p.workspace_id,
        p.actor_id,
        operationId,
      ]),
    )
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
async function authority(
  c: PoolClient,
  p: Principal,
  input: ReturnType<typeof excelCommitInput>["input"],
) {
  const g = await workspaceAuthority(c, p, input.id, true);
  const r = await revisionAuthority(c, p, g, input.revision_id, true);
  if (r.option_id !== input.option_id) throw unavailable();
  const prior = (
    await c.query(
      "SELECT estimate_id,estimate_version_id FROM ppo.excel_imports WHERE workspace_id=$1 AND created_by=$2 AND operation_id=$3",
      [p.workspace_id, p.actor_id, input.operation_id],
    )
  ).rows[0];
  if (prior)
    await estimateContext(
      c,
      p,
      prior.estimate_id,
      "estimating.edit",
      prior.estimate_version_id,
    );
}
export async function commitExcelWorkbook(
  p: Principal,
  id: string,
  value: unknown,
  store: DocumentStoreAdapter = documentStore(),
) {
  const request = excelCommitInput(id, value);
  // Current authority precedes file decoding, source parsing, storage and receipt disclosure.
  await transaction((c) => authority(c, p, request.input));
  const { name, bytes } = decodeExcelFile(request.file);
  const input = {
    ...request.input,
    file: { name, bytes: bytes.length, sha256: digest(bytes) },
  };
  const payloadHash = reviewHash({ command: excelCommitCommand, ...input });
  const recover = () =>
    transaction(async (c) => {
      await lockOperation(c, p, input.operation_id);
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
        p.workspace_id,
      ]);
      await authority(c, p, input);
      return priorReceipt(c, p, input.operation_id, payloadHash);
    });
  const replay = await recover();
  if (replay) return { receipt: replay, replayed: true };
  try {
    let book;
    try {
      book = await readWorkbook(bytes, name);
    } catch (error) {
      if (error instanceof WorkbookRejected)
        throw new AppError(422, "WorkbookRejected", error.message);
      throw error;
    }
    const reviewed = async (c: PoolClient) => {
      const current = await readReviewTarget(
        c,
        p,
        id,
        input.option_id,
        input.revision_id,
      );
      if (current.target.expected_estimate_version !== 0)
        throw new AppError(
          409,
          "ExcelImportComparisonRequired",
          "This option already has an estimate. A reviewed revised-workbook comparison is required.",
        );
      if (current.basis_hash !== input.basis_hash)
        throw new AppError(
          409,
          "ExcelImportBasisChanged",
          "Review the current selected scope and estimate before saving.",
        );
      const review = reviewWorkbook(book, current.target, current.today);
      if (!review.validation_passed)
        throw new AppError(
          422,
          "ExcelImportBlocked",
          "Resolve every workbook validation error before saving.",
        );
      if (review.review_hash !== input.review_hash)
        throw new AppError(
          409,
          "ExcelImportReviewChanged",
          "Review and confirm the exact current workbook proposal before saving.",
        );
      return review;
    };
    const review = await transaction(reviewed),
      target = review.basis;
    const lines = review.lines.map((l) => ({
      ...l,
      line_id: randomUUID(),
    }));
    const receiver = costingInput(id, {
      schema_version: 1,
      operation_id: input.operation_id,
      reason: input.reason,
      estimate_id: randomUUID(),
      option_id: input.option_id,
      revision_id: input.revision_id,
      expected_workspace_version: target.expected_workspace_version,
      expected_estimate_version: 0,
      context_hash: target.context_hash,
      title: review.metadata.title,
      policy: arithmeticPolicy,
      scope: Object.fromEntries(
        ["included", "excluded", "assumptions"].map((k, i) => [
          k,
          review.scope_comparison[i].proposed === ""
            ? "None declared."
            : review.scope_comparison[i].proposed,
        ]),
      ),
      lines: lines.map((l) => ({
        id: l.line_id,
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
    });

    const storageContext = {
      ...p,
      operation_id: excelStorageOperation(p, input.operation_id),
    };
    const key = await store.store(storageContext, bytes, input.file.sha256);
    const retained = await store.read(storageContext, key);
    if (
      key.sha256 !== input.file.sha256 ||
      !Buffer.from(retained).equals(bytes)
    )
      throw new AppError(
        503,
        "ExcelSourceVerificationFailed",
        "The exact original workbook could not be verified. Recover using the original operation.",
      );
    return await sharedOperation(
      p,
      input,
      excelCommitCommand,
      (c) => authority(c, p, input),
      async (c) => {
        const review = await reviewed(c),
          target = review.basis;
        const result = await writeDiscoveryCosting(c, p, receiver);
        const receipt_id = randomUUID(),
          audit_event_id = randomUUID();
        const { review_hash, ...document } = review;
        await c.query(
          `INSERT INTO ppo.excel_imports
      (workspace_id,company_id,estimate_id,estimate_version_id,estimating_workspace_id,option_id,revision_id,
       operation_id,receipt_id,audit_event_id,source_key,review,canonical_review,review_hash,confirmations,created_by,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [
            p.workspace_id,
            target.company_id,
            result.id,
            result.current_version_id,
            id,
            input.option_id,
            input.revision_id,
            input.operation_id,
            receipt_id,
            audit_event_id,
            key,
            review,
            canonical(document),
            review_hash,
            JSON.stringify(input.confirmations),
            p.actor_id,
            input.reason,
          ],
        );
        for (const [ordinal, l] of lines.entries())
          await c.query(
            `INSERT INTO ppo.excel_import_lines
      (workspace_id,estimate_version_id,ordinal,line_ref,line_id,section_ref,source_ref,included,print)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
              p.workspace_id,
              result.current_version_id,
              ordinal,
              l.line_ref,
              l.line_id,
              l.section_ref,
              l.source_ref,
              l.included,
              l.print,
            ],
          );
        return {
          ...result,
          receipt_id,
          audit_event_id,
          audit_details: {
            ...result.audit_details,
            excel_import: {
              review_hash,
              source_sha256: input.file.sha256,
              mapping_version: review.mapping_version,
              parser: review.parser,
              workbook_ref: review.metadata.workbook_ref,
              line_count: lines.length,
            },
          },
        };
      },
      "Estimate",
      "EstimateCreated",
    );
  } catch (error) {
    // A concurrent identical save can win between preflight and source verification.
    // Recover only an accepted exact intent, still under current historical access.
    const accepted = await recover();
    if (accepted) return { receipt: accepted, replayed: true };
    throw error;
  }
}
