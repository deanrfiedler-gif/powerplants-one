import { EXCEL_CAPACITY } from "./capacity";
import type { QueryClient } from "../../platform/permissions";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { sharedOperation, canonical } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import { object, uuid, invalid } from "../../shared/validation";
import { digest } from "../../documents/store";
import { estimateContext, versionContext, quoteContext } from "../context";
import { parseQuoteChoices, quoteInput } from "../validation";
import {
  quoteContent,
  writeDraftQuote,
  versionHash,
  expected,
} from "../service";
import { quoteTemplate } from "../template";
import { quoteAmounts, type QuoteChoice } from "../math";
import { retainedAuthority } from "./retained";
import { readReviewTarget } from "./service";
import { hashField } from "./commit";

export const excelQuoteCommand = "ExcelImport:PrepareDraftQuote";
export const excelQuoteConfirmations = [
  "CustomerWording",
  "IncludePrint",
  "Reconciliation",
] as const;
const changed = () =>
  new AppError(
    409,
    "ExcelQuoteReviewChanged",
    "Review the current imported estimate, quotation choices and customer wording again.",
  );

async function authority(
  c: QueryClient,
  p: Principal,
  id: string,
  versionId: string,
) {
  const source = await retainedAuthority(c, p, id, versionId, true);
  const e = await estimateContext(
    c,
    p,
    id,
    "estimating.quote.prepare",
    versionId,
  );
  await estimateContext(c, p, id, "estimating.quote.read", versionId);
  return { source, e, v: await versionContext(c, p, e, versionId) };
}

async function review(
  c: PoolClient,
  p: Principal,
  id: string,
  versionId: string,
  supplied?: QuoteChoice[],
) {
  const { source, e, v } = await authority(c, p, id, versionId);
  // New content must use the current selected Complete basis; accepted recovery does not.
  const basis = await readReviewTarget(
    c,
    p,
    source.estimating_workspace_id,
    source.option_id,
    source.revision_id,
  );
  if (
    e.current_version_id !== v.id ||
    basis.target.estimate_version_id !== v.id ||
    versionHash(v) !== v.content_hash
  )
    throw changed();
  const mapped = (
    await c.query<{
      line_id: string;
      line_ref: string;
      included: boolean;
      print: boolean;
    }>(
      "SELECT line_id,line_ref,included,print FROM ppo.excel_line_history WHERE workspace_id=$1 AND estimate_version_id=$2 ORDER BY ordinal",
      [p.workspace_id, v.id],
    )
  ).rows;
  const proposals = v.lines.map((line) => {
    const row = mapped.find((row) => row.line_id === line.id);
    return {
      line_id: line.id,
      description: line.description,
      line_ref: row?.line_ref ?? null,
      proposal: row ? { included: row.included, print: row.print } : null,
    };
  });
  const unresolved = proposals
    .filter((line) => !line.proposal)
    .map((line) => line.line_id);
  const choices =
    supplied ??
    (unresolved.length
      ? null
      : proposals.map((line) => ({
          line_id: line.line_id,
          ...line.proposal!,
        })));
  if (
    choices &&
    (choices.length !== v.lines.length ||
      choices.some(
        (choice) => !v.lines.some((line) => line.id === choice.line_id),
      ))
  )
    throw new AppError(
      422,
      "QuoteSelectionInvalid",
      "Choose include and print for every line of the exact saved estimate version.",
    );
  const prior = (
    await c.query<{ id: string; version: number; current_revision_id: string }>(
      "SELECT id,version,current_revision_id FROM ppo.draft_quotes WHERE workspace_id=$1 AND estimate_id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  // A current quote may have an older scope: do not reveal its identity without current access.
  if (prior) await quoteContext(c, p, prior.current_revision_id);
  const canPrepare = !!choices?.some((choice) => choice.included);
  const content = canPrepare ? await quoteContent(c, p, e, v, choices!) : null;
  const template = content
    ? await quoteTemplate({
        display_number: "Assigned on save",
        revision: (prior?.version ?? 0) + 1,
        ...content,
      })
    : null;
  const workbookLines = v.lines.filter((line) =>
    mapped.some((row) => row.line_id === line.id),
  );
  const workbookChoices = mapped.map((row) => ({
    line_id: row.line_id,
    included: row.included,
    print: row.print,
  }));
  const reviewedWorkbook = choices
    ? choices.filter((choice) =>
        mapped.some((row) => row.line_id === choice.line_id),
      )
    : [];
  const value = {
    schema_version: 1,
    synthetic: true,
    state: "ReviewRequired",
    can_prepare: canPrepare,
    actor_id: p.actor_id,
    estimate_id: id,
    estimate_version_id: v.id,
    expected_version: e.version,
    estimate_content_hash: v.content_hash,
    import_review_hash: source.review_hash,
    source_sha256: source.review.file.sha256,
    basis_hash: basis.basis_hash,
    option_id: source.option_id,
    revision_id: source.revision_id,
    expected_quote_version: prior?.version ?? 0,
    previous_quote_revision_id: prior?.current_revision_id ?? null,
    proposals,
    unresolved_line_ids: supplied ? [] : unresolved,
    choices:
      choices?.slice().sort((a, b) => a.line_id.localeCompare(b.line_id)) ??
      null,
    choice_changes: choices
      ? proposals
          .filter(
            (line) =>
              line.proposal &&
              choices.some(
                (choice) =>
                  choice.line_id === line.line_id &&
                  (choice.included !== line.proposal!.included ||
                    choice.print !== line.proposal!.print),
              ),
          )
          .map((line) => line.line_id)
      : [],
    reconciliation: {
      estimate_sell: v.sell_total,
      workbook_included_sell: quoteAmounts(workbookLines, workbookChoices)
        .total,
      reviewed_workbook_sell: choices
        ? quoteAmounts(workbookLines, reviewedWorkbook).total
        : null,
      retained_lines_sell: choices
        ? quoteAmounts(
            v.lines.filter(
              (line) => !mapped.some((row) => row.line_id === line.id),
            ),
            choices,
          ).total
        : null,
      quote_total: content?.total ?? null,
    },
    customer_content: content,
    template_hash: template?.template_hash ?? null,
  };
  return {
    ...value,
    review_hash: canPrepare ? digest(canonical(value)) : null,
  };
}

export async function reviewExcelQuotation(
  p: Principal,
  id: string,
  value: unknown,
) {
  const r = object(value, ["estimate_version_id", "choices"]);
  const versionId = uuid(r.estimate_version_id, "estimate_version_id");
  const choices =
    r.choices === undefined ? undefined : parseQuoteChoices(r.choices, EXCEL_CAPACITY.lines);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    return review(c, p, uuid(id, "estimate_id"), versionId, choices);
  });
}

export async function prepareExcelQuotation(
  p: Principal,
  id: string,
  value: unknown,
) {
  // Native validation keeps the established command envelope and explicit choices.
  const { review_hash, confirmations, ...native } = object(value, [
    "schema_version",
    "operation_id",
    "reason",
    "id",
    "estimate_version_id",
    "expected_version",
    "expected_quote_version",
    "choices",
    "review_hash",
    "confirmations",
  ]);
  const q = quoteInput(id, native, EXCEL_CAPACITY.lines);
  if (
    !Array.isArray(confirmations) ||
    confirmations.length !== excelQuoteConfirmations.length ||
    new Set(confirmations).size !== confirmations.length ||
    excelQuoteConfirmations.some((v) => !confirmations.includes(v))
  )
    invalid(
      "confirmations",
      "Confirm customer wording, include/print choices and reconciliation for this exact review.",
    );
  const input = {
    ...q,
    choices: q.choices
      .slice()
      .sort((a, b) => a.line_id.localeCompare(b.line_id)),
    review_hash: hashField(review_hash, "review_hash"),
    confirmations: [...excelQuoteConfirmations],
  };
  return sharedOperation(
    p,
    input,
    excelQuoteCommand,
    (c) => authority(c, p, id, input.estimate_version_id),
    async (c, { e, v }) => {
      const reviewed = await review(
        c,
        p,
        id,
        input.estimate_version_id,
        input.choices,
      );
      expected(e.version, input.expected_version);
      expected(reviewed.expected_quote_version, input.expected_quote_version);
      if (!reviewed.can_prepare || reviewed.review_hash !== input.review_hash)
        throw changed();
      const result = await writeDraftQuote(c, p, input, e, v);
      const { q: saved } = await quoteContext(c, p, input.id);
      const {
        display_number: _number,
        revision: _revision,
        ...content
      } = saved.safe_snapshot;
      void _number;
      void _revision;
      if (
        saved.template_hash !== reviewed.template_hash ||
        canonical(content) !== canonical(reviewed.customer_content)
      )
        throw changed();
      return {
        ...result,
        audit_details: {
          ...result.audit_details,
          excel_quotation: {
            review: reviewed,
            confirmations: input.confirmations,
          },
        },
      };
    },
    "DraftQuoteRevision",
    "DraftQuotePrepared",
  );
}

export async function excelQuoteReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  const { q } = await quoteContext(c, p, id, "estimating.quote.prepare");
  await authority(c, p, q.estimate_id, q.estimate_version_id);
}

export async function readExcelQuotationEvidence(p: Principal, id: string) {
  return transaction(async (c) => {
    const { q } = await quoteContext(c, p, id);
    await retainedAuthority(c, p, q.estimate_id, q.estimate_version_id);
    const row = (
      await c.query(
        `SELECT a.actor_id,a.occurred_at,a.reason,a.operation_id,a.details->'excel_quotation' AS evidence
      FROM ppo.audit_events a WHERE a.workspace_id=$1 AND a.object_type='DraftQuoteRevision' AND a.object_id=$2 AND a.details->>'command'=$3`,
        [p.workspace_id, id, excelQuoteCommand],
      )
    ).rows[0];
    if (!row?.evidence) throw unavailable();
    return {
      synthetic: true,
      quote_revision_id: q.id,
      estimate_version_id: q.estimate_version_id,
      ...row,
    };
  });
}
