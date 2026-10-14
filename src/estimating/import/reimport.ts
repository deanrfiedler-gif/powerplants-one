import { EXCEL_CAPACITY } from "./capacity";
import { randomUUID } from "node:crypto";
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
import { commonKeys, invalid, object } from "../../shared/validation";
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
import {
  excelCommitInput,
  excelConfirmations,
  excelStorageOperation,
  hashField,
} from "./commit";
import {
  compareReviewed,
  lineDecisions,
  mismatch,
  projectComparison,
} from "./comparison";

export const excelReimportCommand = "ExcelImport:Reimport";
function command(id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "option_id",
    "revision_id",
    "basis_hash",
    "review_hash",
    "confirmations",
    "file",
    "comparison_hash",
    "decisions",
    "changes_confirmed",
  ]);
  const { comparison_hash, decisions, changes_confirmed, ...base } = r;
  if (changes_confirmed !== true)
    invalid(
      "changes_confirmed",
      "Confirm the exact comparison, including replacements of PPO edits.",
    );
  const parsed = excelCommitInput(id, base);
  return {
    file: parsed.file,
    input: {
      ...parsed.input,
      comparison_hash: hashField(comparison_hash, "comparison_hash"),
      decisions: lineDecisions(decisions),
      changes_confirmed: true,
    },
  };
}
async function authority(
  c: PoolClient,
  p: Principal,
  input: ReturnType<typeof command>["input"],
) {
  const g = await workspaceAuthority(c, p, input.id, true),
    r = await revisionAuthority(c, p, g, input.revision_id, true);
  if (r.option_id !== input.option_id) throw unavailable();
  const accepted = (
    await c.query(
      "SELECT estimate_id,estimate_version_id FROM ppo.excel_reimports WHERE workspace_id=$1 AND created_by=$2 AND operation_id=$3",
      [p.workspace_id, p.actor_id, input.operation_id],
    )
  ).rows[0];
  if (accepted)
    await estimateContext(
      c,
      p,
      accepted.estimate_id,
      "estimating.edit",
      accepted.estimate_version_id,
    );
}
export async function reimportExcelWorkbook(
  p: Principal,
  id: string,
  value: unknown,
  store: DocumentStoreAdapter = documentStore(),
) {
  const request = command(id, value);
  await transaction((c) => authority(c, p, request.input));
  const { name, bytes } = decodeExcelFile(request.file);
  const input = {
    ...request.input,
    file: { name, bytes: bytes.length, sha256: digest(bytes) },
  };
  const payloadHash = reviewHash({ command: excelReimportCommand, ...input });
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
      if (current.basis_hash !== input.basis_hash) throw mismatch();
      const review = reviewWorkbook(book, current.target, current.today);
      if (!review.validation_passed)
        throw new AppError(
          422,
          "ExcelImportBlocked",
          "Resolve all workbook errors before saving.",
        );
      if (review.review_hash !== input.review_hash) throw mismatch();
      const comparison = await compareReviewed(c, p, review);
      if (comparison.comparison_hash !== input.comparison_hash)
        throw mismatch();
      const projection = projectComparison(comparison, input.decisions);
      const receiver = costingInput(id, {
        schema_version: 1,
        operation_id: input.operation_id,
        reason: input.reason,
        estimate_id: current.target.estimate_id,
        option_id: input.option_id,
        revision_id: input.revision_id,
        expected_workspace_version: current.target.expected_workspace_version,
        expected_estimate_version: current.target.expected_estimate_version,
        context_hash: current.target.context_hash,
        title: review.metadata.title,
        policy: arithmeticPolicy,
        scope: Object.fromEntries(
          ["included", "excluded", "assumptions"].map((k, i) => [
            k,
            review.scope_comparison[i].proposed || "None declared.",
          ]),
        ),
        lines: projection.map((p) => p.line),
      }, EXCEL_CAPACITY);
      return { review, comparison, projection, receiver };
    };
    // Validate the entire resolved native command, including kept lines, before external I/O.
    await transaction(reviewed);
    const storageContext = {
      ...p,
      operation_id: excelStorageOperation(p, input.operation_id),
    };
    const key = await store.store(storageContext, bytes, input.file.sha256);
    if (
      key.sha256 !== input.file.sha256 ||
      !Buffer.from(await store.read(storageContext, key)).equals(bytes)
    )
      throw new AppError(
        503,
        "ExcelSourceVerificationFailed",
        "The exact revised workbook could not be verified. Recover the original operation.",
      );
    return await sharedOperation(
      p,
      input,
      excelReimportCommand,
      (c) => authority(c, p, input),
      async (c) => {
        const { review, comparison, projection, receiver } = await reviewed(c);
        const result = await writeDiscoveryCosting(c, p, receiver),
          receipt_id = randomUUID(),
          audit_event_id = randomUUID();
        const { review_hash, ...reviewDocument } = review,
          { comparison_hash, ...comparisonDocument } = comparison;
        await c.query(
          `INSERT INTO ppo.excel_reimports
        (workspace_id,company_id,estimate_id,estimate_version_id,estimating_workspace_id,option_id,revision_id,predecessor_id,
         operation_id,receipt_id,audit_event_id,source_key,review,canonical_review,review_hash,confirmations,created_by,reason,
         comparison,canonical_comparison,comparison_hash,decisions,projection)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
          [
            p.workspace_id,
            review.basis.company_id,
            result.id,
            result.current_version_id,
            id,
            input.option_id,
            input.revision_id,
            comparison.predecessor.version_id,
            input.operation_id,
            receipt_id,
            audit_event_id,
            key,
            review,
            canonical(reviewDocument),
            review_hash,
            JSON.stringify([...excelConfirmations]),
            p.actor_id,
            input.reason,
            comparison,
            canonical(comparisonDocument),
            comparison_hash,
            JSON.stringify(input.decisions),
            JSON.stringify(projection),
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
              comparison_hash,
              changes_confirmed: true,
              decisions: input.decisions,
              source_sha256: input.file.sha256,
              workbook_ref: review.metadata.workbook_ref,
              line_count: projection.length,
            },
          },
        };
      },
      "Estimate",
      "EstimateVersionSaved",
    );
  } catch (error) {
    const accepted = await recover();
    if (accepted) return { receipt: accepted, replayed: true };
    throw error;
  }
}
