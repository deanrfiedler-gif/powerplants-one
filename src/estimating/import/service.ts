import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import { invalid, object, uuid } from "../../shared/validation";
import { selectedBasis } from "../cost-basis-service";
import { costingProposal } from "../cost-basis-validation";
import { WORKBOOK_LIMITS, WorkbookRejected } from "./archive";
import { readWorkbook } from "./reader";
import { reviewHash, reviewWorkbook, type ReviewTarget } from "./review";

export const uploadRequestLimit =
  4 * Math.ceil(WORKBOOK_LIMITS.compressed / 3) + 4096;

async function currentTarget(
  p: Principal,
  id: string,
  optionId: string,
  revisionId: string,
) {
  return transaction(async (c) => {
    // The native Draft-group guard takes a short row lock. It performs no writes.
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    const { g, option, r, targets, e } = await selectedBasis(
      c,
      p,
      uuid(id, "workspace_id"),
      optionId,
      revisionId,
    );
    if (!r.site_id)
      throw new AppError(
        409,
        "ImportSiteRequired",
        "This workbook pilot requires a selected Site.",
      );
    const target: ReviewTarget = {
      workspace_id: g.id,
      company_id: g.company_id,
      actor_id: p.actor_id,
      opportunity_id: g.opportunity_id,
      organisation_id: targets.references.organisation.id,
      site_id: r.site_id,
      option_id: option.id,
      revision_id: r.id,
      expected_workspace_version: g.version,
      expected_estimate_version: e?.version ?? 0,
      estimate_id: e?.id ?? null,
      estimate_version_id: e?.current_version_id ?? null,
      content_hash: r.content_hash!,
      context_hash: targets.context_hash,
      discovery: targets.compiled.input,
    };
    const today = (
      await c.query<{ today: string }>(
        "SELECT to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD') AS today",
      )
    ).rows[0].today;
    return { target, basis_hash: reviewHash(target), today };
  });
}

export async function prepareExcelReview(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = costingProposal(value);
  const { target, basis_hash } = await currentTarget(
    p,
    id,
    input.option_id,
    input.revision_id,
  );
  return {
    target,
    basis_hash,
    mapping: "NativeUuidOnly",
    limits: WORKBOOK_LIMITS,
    durable: false,
    can_import: false,
    synthetic: true,
  };
}

export async function previewExcelWorkbook(
  p: Principal,
  id: string,
  value: unknown,
) {
  const r = object(value, ["option_id", "revision_id", "basis_hash", "file"]);
  const input = costingProposal({
    option_id: r.option_id,
    revision_id: r.revision_id,
  });
  const before = await currentTarget(p, id, input.option_id, input.revision_id);
  if (typeof r.basis_hash !== "string" || r.basis_hash !== before.basis_hash)
    throw new AppError(
      409,
      "ExcelImportBasisChanged",
      "Review the current selected scope and estimate before uploading this workbook.",
    );
  const file = object(r.file, ["name", "base64"]);
  if (
    typeof file.name !== "string" ||
    !file.name ||
    file.name.length > 160 ||
    /[\\/\u0000-\u001f\u007f]/.test(file.name) ||
    !/\.xlsx$/i.test(file.name)
  )
    invalid("file.name", "Use a plain .xlsx filename within 160 characters.");
  if (
    typeof file.base64 !== "string" ||
    !file.base64.length ||
    file.base64.length > 4 * Math.ceil(WORKBOOK_LIMITS.compressed / 3) ||
    file.base64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64)
  )
    invalid(
      "file.base64",
      "Use canonical base64 for one workbook within the 5 MiB limit.",
    );
  const bytes = Buffer.from(file.base64, "base64");
  if (
    bytes.length > WORKBOOK_LIMITS.compressed ||
    bytes.toString("base64") !== file.base64
  )
    invalid(
      "file.base64",
      "Use canonical base64 for one workbook within the 5 MiB limit.",
    );
  let book;
  try {
    book = await readWorkbook(bytes, file.name);
  } catch (error) {
    if (error instanceof WorkbookRejected)
      throw new AppError(422, "WorkbookRejected", error.message);
    throw error;
  }
  // Parsing is deliberately outside the transaction; fresh authority must hold
  // before returning any source/context evidence. No permission snapshot is reused.
  const after = await currentTarget(p, id, input.option_id, input.revision_id);
  if (after.basis_hash !== before.basis_hash)
    throw new AppError(
      409,
      "ExcelImportBasisChanged",
      "The selected scope or estimate changed while reading. Prepare and review the current basis.",
    );
  return reviewWorkbook(book, after.target, after.today);
}
